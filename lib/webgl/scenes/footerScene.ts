/**
 * FOOTER.
 *
 * A long tube (a shallow quadratic bezier extruded into a cylinder) drawn as
 * points, rippling with a layered sine/cosine wave and pushed away from the
 * cursor. Fog fades in on scroll, and the `.footer--emblem` mark rotates a
 * quarter turn when it enters view. Port of `Bo()` plus `Do()` and the wave
 * helpers from the original bundle.
 *
 * Uses the fogged, fully-opaque shader pair.
 */

import * as THREE from "three";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { POINTS_FOG_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

/** Per-axis wave frequencies. Deliberately unequal so the ripple never loops. */
const WAVE_FREQUENCY_X = 0.01;
const WAVE_FREQUENCY_Y = 0.015;
const WAVE_FREQUENCY_Z = 0.02;

const CAMERA_POSITION = { x: 0, y: 0.4, z: 49.6 };
const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

const TUBE_RADIUS = 1.5;
const TUBE_TUBULAR_SEGMENTS = 60;
const TUBE_RADIAL_SEGMENTS = 60;
/** Bezier control-point height. Zero, so the curve is a straight line. */
const TUBE_ARC_HEIGHT = 0;
const TUBE_LENGTH = 22;

const TUBE_POSITION = { x: -4.2, y: -2.5, z: 36 };
const TUBE_ROTATION_DEG = { x: 0, y: -65, z: 16 };

/** 0xd1d1d1 */
const PARTICLE_COLOR = 13750737;
const PARTICLE_SIZE = 0.2;
const SIZE_ATTENUATION = 170;

const FOG_NEAR = 0;
/** Fog starts at far=0 (everything hidden) and animates out to this on enter. */
const FOG_FAR = 15;
/** 0x111111 */
const FOG_COLOR = 1118481;
const CLEAR_COLOR = 1118481;

/** Below this width the scene is skipped entirely -- no renderer is created. */
const DESKTOP_BREAKPOINT = 1024;
const MAX_PIXEL_RATIO = 2;
const VISIBILITY_THRESHOLD = 0.1;
const TIME_STEP = 0.01;

/** Wave amplitude. Zero on touch/reduced-motion, which freezes the surface. */
const WAVE_AMPLITUDE = 0.02;
/** Cursor repulsion radius in CSS pixels. */
const MOUSE_RADIUS = 125;
const MOUSE_STRENGTH = 1.5;
/** Per-frame easing toward the target displacement. */
const MOUSE_EASING = 0.1;

const RESIZE_DEBOUNCE_MS = 300;

export interface FooterScene {
  init(): void;
  destroy(): void;
}

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** One axis of the ripple: a sine of a sine (or cosine) for a soft, wide wave. */
function waveComponent(
  time: number,
  coordinate: number,
  frequency: number,
  useCosine: boolean,
): number {
  const trig = useCosine ? Math.cos : Math.sin;
  return 0.5 * Math.sin(trig(time + coordinate * frequency) * Math.PI);
}

function waveOffset(time: number, x: number, y: number, z: number) {
  return {
    x: waveComponent(time, x, WAVE_FREQUENCY_X, false),
    y: waveComponent(time, y, WAVE_FREQUENCY_Y, true),
    z: waveComponent(time, z, WAVE_FREQUENCY_Z, false),
  };
}

function applyVertex(
  target: Float32Array,
  index: number,
  original: Float32Array,
  wave: { x: number; y: number; z: number },
  amplitude: number,
  mouseOffsets: Float32Array,
  isTouchDevice: boolean,
): void {
  const mx = isTouchDevice ? 0 : mouseOffsets[index];
  const my = isTouchDevice ? 0 : mouseOffsets[index + 1];
  const mz = isTouchDevice ? 0 : mouseOffsets[index + 2];

  target[index] = original[index] + wave.x * amplitude + mx;
  target[index + 1] = original[index + 1] + wave.y * amplitude + my;
  target[index + 2] = original[index + 2] + wave.z * amplitude + mz;
}

interface TubeGeometryHandle {
  create(): void;
  getGeometry(): THREE.BufferGeometry | null;
  getOriginalPositions(): Float32Array | null;
  getMatrixWorld(): THREE.Matrix4 | null;
  destroy(): void;
}

function createTube(scene: THREE.Scene): TubeGeometryHandle {
  let points: THREE.Points<THREE.TubeGeometry, THREE.ShaderMaterial> | null =
    null;
  let originalPositions: Float32Array | null = null;

  return {
    create() {
      // TubeGeometry keeps its own reference to the curve, so nothing else
      // needs to hold onto it.
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-TUBE_LENGTH / 2, 0, 0),
        new THREE.Vector3(0, TUBE_ARC_HEIGHT, 0),
        new THREE.Vector3(TUBE_LENGTH / 2, 0, 0),
      );

      const geometry = new THREE.TubeGeometry(
        curve,
        TUBE_TUBULAR_SEGMENTS,
        TUBE_RADIUS,
        TUBE_RADIAL_SEGMENTS,
        false,
      );

      points = new THREE.Points(
        geometry,
        new THREE.ShaderMaterial({
          uniforms: THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
              color: { value: new THREE.Color(PARTICLE_COLOR) },
              size: { value: PARTICLE_SIZE },
              sizeAttenuation: { value: SIZE_ATTENUATION },
            },
          ]),
          vertexShader: POINTS_FOG_VERT,
          fragmentShader: POINTS_FOG_FRAG,
          fog: true,
          transparent: false,
        }),
      );

      points.position.set(TUBE_POSITION.x, TUBE_POSITION.y, TUBE_POSITION.z);
      points.rotation.set(
        degToRad(TUBE_ROTATION_DEG.x),
        degToRad(TUBE_ROTATION_DEG.y),
        degToRad(TUBE_ROTATION_DEG.z),
      );
      scene.add(points);

      originalPositions = new Float32Array(
        points.geometry.attributes.position.array,
      );
    },

    getGeometry() {
      return points ? points.geometry : null;
    },

    getOriginalPositions() {
      return originalPositions;
    },

    getMatrixWorld() {
      return points ? points.matrixWorld : null;
    },

    destroy() {
      if (points) {
        points.geometry.dispose();
        points.material.dispose();
        scene.remove(points);
        points = null;
      }
      originalPositions = null;
    },
  };
}

interface WaveController {
  init(): void;
  updateWavePositions(time: number): void;
  handleMouseMove(event: MouseEvent): void;
  destroy(): void;
}

function createWaveController(options: {
  tubeGeometry: TubeGeometryHandle;
  camera: THREE.PerspectiveCamera;
  isTouchDevice: boolean;
  prefersReducedMotion?: boolean;
  canvas?: HTMLCanvasElement | null;
}): WaveController {
  const {
    tubeGeometry,
    camera,
    isTouchDevice,
    prefersReducedMotion = false,
    canvas = null,
  } = options;

  let worldPoint: THREE.Vector3 | null = null;
  let projected: THREE.Vector3 | null = null;
  const mouse = { x: 0, y: 0 };
  let targetOffsets: Float32Array | null = null;
  let smoothedOffsets: Float32Array | null = null;
  /** Zero-filled stand-in used when mouse tracking is disabled. */
  let emptyOffsets: Float32Array = new Float32Array(0);

  const amplitude = isTouchDevice || prefersReducedMotion ? 0 : WAVE_AMPLITUDE;

  function updateMouseOffsets(): void {
    const original = tubeGeometry.getOriginalPositions();
    const matrixWorld = tubeGeometry.getMatrixWorld();
    if (!original || !matrixWorld || !worldPoint || !projected) return;
    if (!targetOffsets || !smoothedOffsets) return;

    // The canvas backing store is scaled by the renderer's pixel ratio, so
    // dividing by devicePixelRatio brings it back to CSS pixels to match the
    // pointer coordinates.
    const width = canvas
      ? canvas.width / window.devicePixelRatio
      : window.innerWidth;
    const height = canvas
      ? canvas.height / window.devicePixelRatio
      : window.innerHeight;

    const vertexCount = original.length / 3;
    for (let p = 0; p < vertexCount; p++) {
      const i = 3 * p;
      worldPoint.set(original[i], original[i + 1], original[i + 2]);
      worldPoint.applyMatrix4(matrixWorld);
      projected.copy(worldPoint).project(camera);

      const screenX = (0.5 * projected.x + 0.5) * width;
      const screenY = (0.5 * -projected.y + 0.5) * height;
      const dx = screenX - mouse.x;
      const dy = screenY - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MOUSE_RADIUS) {
        const falloff = 1 - distance / MOUSE_RADIUS;
        const angle = Math.atan2(dy, dx);
        targetOffsets[i] = -Math.cos(angle) * falloff * MOUSE_STRENGTH;
        targetOffsets[i + 1] = -Math.sin(angle) * falloff * MOUSE_STRENGTH;
        targetOffsets[i + 2] = MOUSE_STRENGTH * falloff * 0.5;
      } else {
        targetOffsets[i] = 0;
        targetOffsets[i + 1] = 0;
        targetOffsets[i + 2] = 0;
      }

      smoothedOffsets[i] += MOUSE_EASING * (targetOffsets[i] - smoothedOffsets[i]);
      smoothedOffsets[i + 1] +=
        MOUSE_EASING * (targetOffsets[i + 1] - smoothedOffsets[i + 1]);
      smoothedOffsets[i + 2] +=
        MOUSE_EASING * (targetOffsets[i + 2] - smoothedOffsets[i + 2]);
    }
  }

  return {
    init() {
      const original = tubeGeometry.getOriginalPositions();
      if (original && !isTouchDevice) {
        worldPoint = new THREE.Vector3();
        projected = new THREE.Vector3();
        targetOffsets = new Float32Array(original.length);
        smoothedOffsets = new Float32Array(original.length);
      }
    },

    updateWavePositions(time: number) {
      const geometry = tubeGeometry.getGeometry();
      const original = tubeGeometry.getOriginalPositions();
      if (!geometry || !original) return;

      const target = geometry.attributes.position.array as Float32Array;

      if (!isTouchDevice) updateMouseOffsets();

      if (!smoothedOffsets && emptyOffsets.length !== target.length) {
        emptyOffsets = new Float32Array(target.length);
      }
      const offsets = smoothedOffsets ?? emptyOffsets;

      for (let i = 0; i < target.length; i += 3) {
        applyVertex(
          target,
          i,
          original,
          waveOffset(time, original[i], original[i + 1], original[i + 2]),
          amplitude,
          offsets,
          isTouchDevice,
        );
      }

      geometry.attributes.position.needsUpdate = true;
    },

    handleMouseMove(event: MouseEvent) {
      if (!canvas) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    },

    destroy() {
      targetOffsets = null;
      smoothedOffsets = null;
      worldPoint = null;
      projected = null;
    },
  };
}

export function createFooterScene(canvas: HTMLCanvasElement): FooterScene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let fog: THREE.Fog | null = null;
  let tube: TubeGeometryHandle | null = null;
  let waves: WaveController | null = null;
  let observer: IntersectionObserver | null = null;
  let onMouseMove: ((event: MouseEvent) => void) | null = null;
  let onResize: (() => void) | null = null;
  let lastWidth = 0;
  let fogTrigger: ScrollTrigger | null = null;
  let emblemTrigger: ScrollTrigger | null = null;
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  let frame = 0;

  const isMobile = window.innerWidth < DESKTOP_BREAKPOINT;
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const state = { time: 0, visible: false, hasRenderedOnce: false };

  function setupResize() {
    lastWidth = window.innerWidth;
    onResize = () => {
      const width = window.innerWidth;
      if (width === lastWidth) return;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      // Debounced: mobile browsers fire resize continuously while the URL bar
      // animates, and re-sizing the buffer mid-scroll is expensive.
      resizeTimeout = setTimeout(() => {
        lastWidth = width;
        if (!camera || !renderer) return;
        canvas.style.width = "";
        canvas.style.height = "";
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, true);
      }, RESIZE_DEBOUNCE_MS);
    };
    window.addEventListener("resize", onResize);
  }

  function animate() {
    frame = requestAnimationFrame(animate);
    if (!state.visible || !renderer || !scene || !camera || !waves) return;

    if (isTouchDevice || reducedMotion) {
      // Static pose: one frame at time 0 and nothing after.
      if (!state.hasRenderedOnce) {
        state.hasRenderedOnce = true;
        waves.updateWavePositions(state.time);
        renderer.render(scene, camera);
      }
      return;
    }

    state.time += TIME_STEP;
    waves.updateWavePositions(state.time);
    renderer.render(scene, camera);
  }

  return {
    init() {
      // The footer scene is desktop-only; below 1024 nothing is constructed.
      if (isMobile) return;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        canvas.clientWidth / canvas.clientHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );
      camera.position.set(
        CAMERA_POSITION.x,
        CAMERA_POSITION.y,
        CAMERA_POSITION.z,
      );

      renderer = new THREE.WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: false,
      });
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
      );
      renderer.setClearColor(CLEAR_COLOR, 1);

      fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, 0);
      scene.fog = fog;

      tube = createTube(scene);
      tube.create();

      waves = createWaveController({
        tubeGeometry: tube,
        camera,
        isTouchDevice,
        prefersReducedMotion: reducedMotion,
        canvas,
      });
      waves.init();

      if (!isTouchDevice) {
        const controller = waves;
        onMouseMove = (event: MouseEvent) => controller.handleMouseMove(event);
        window.addEventListener("mousemove", onMouseMove);
      }

      observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0].isIntersecting;
        },
        { threshold: VISIBILITY_THRESHOLD },
      );
      observer.observe(canvas);

      setupResize();

      if (reducedMotion) {
        fog.far = FOG_FAR;
      } else {
        const sceneFog = fog;
        fogTrigger = ScrollTrigger.create({
          trigger: canvas,
          start: "top 50%",
          end: "bottom bottom",
          onEnter: () => {
            gsap.to(sceneFog, {
              far: FOG_FAR,
              duration: 2,
              ease: "power2.out",
            });
          },
          invalidateOnRefresh: true,
        });
      }

      const emblem = document.querySelector(".footer--emblem");
      if (emblem) {
        gsap.set(emblem, { rotation: 0 });
        if (reducedMotion) {
          gsap.set(emblem, { rotation: -90 });
        } else {
          emblemTrigger = ScrollTrigger.create({
            trigger: emblem,
            start: "top 70%",
            once: true,
            onEnter: () => {
              gsap.timeline().to(emblem, {
                rotation: -90,
                duration: 1,
                ease: "power4.inOut",
              });
            },
            invalidateOnRefresh: true,
          });
        }
      }

      animate();
    },

    destroy() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }
      if (fogTrigger) {
        fogTrigger.kill();
        fogTrigger = null;
      }
      if (emblemTrigger) {
        emblemTrigger.kill();
        emblemTrigger = null;
      }
      if (onMouseMove) {
        window.removeEventListener("mousemove", onMouseMove);
        onMouseMove = null;
      }
      if (onResize) {
        window.removeEventListener("resize", onResize);
        onResize = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (waves) {
        waves.destroy();
        waves = null;
      }
      if (tube) {
        tube.destroy();
        tube = null;
      }
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }
      if (scene) {
        scene.fog = null;
        scene.clear();
        scene = null;
      }
      camera = null;
      fog = null;
    },
  };
}
