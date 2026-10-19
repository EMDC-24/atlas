/**
 * INVESTORS / FOUNDERS (why-wqf).
 *
 * A stack of five flat point-grids that morphs into an open cylinder as the
 * founders section scrolls into view, scattering the particles outward at the
 * halfway point and pulling them back together at the end. Port of `zs()`
 * plus its helpers (`Cs`, `Os`) from the original bundle.
 *
 * Uses the fogged shader with the extra `opacity` uniform, because the scene
 * dims the particles to 50% at peak scatter.
 */

import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";
import { POINTS_FOG_OPACITY_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const CAMERA_X = 0;
const CAMERA_Y = 0;
/** Camera Y at the end of the scroll -- it drops below the cylinder. */
const CAMERA_Y_END = -10;
const CAMERA_Z_START = 16;
const CAMERA_Z_END = 11.4;
const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
/** Below this width the camera is pushed back 5 units to fit the shape. */
const MOBILE_BREAKPOINT = 768;
const MOBILE_CAMERA_Z_OFFSET = 5;

const PLANE_WIDTH = 8;
const PLANE_HEIGHT = 10;
const PLANE_WIDTH_SEGMENTS = 20;
const PLANE_HEIGHT_SEGMENTS = 20;
const PLANE_COUNT = 5;
/** Axis the five planes are stacked along. */
const STACK_AXIS: "x" | "y" | "z" = "z";

/** 0xb5b5b5 */
const PARTICLE_COLOR = 11908533;
const PARTICLE_SIZE = 0.35;
const SIZE_ATTENUATION = 170;

const START_ROTATION_DEG = { x: 0, y: 90, z: 0 };
const END_ROTATION_DEG = { x: 90, y: 0, z: 0 };
const START_POSITION = { x: 0, y: 0, z: 0 };
const END_POSITION = { x: 0, y: 0, z: 8 };

const CYLINDER_RADIUS_TOP = 3;
const CYLINDER_RADIUS_BOTTOM = 3;
const CYLINDER_HEIGHT = 30;
const CYLINDER_RADIAL_SEGMENTS = 50;
const CYLINDER_HEIGHT_SEGMENTS = 20;

/** World units a particle travels at full scatter. */
const SCATTER_DISTANCE = 2;
/** Morph progress at which the scatter peaks. */
const SCATTER_PEAK = 0.5;

const FOG_NEAR = 0;
const FOG_FAR = 25;
/** 0x111111 -- matches the clear colour so particles fade into the backdrop. */
const FOG_COLOR = 1118481;
const CLEAR_COLOR = 1118481;

const MAX_PIXEL_RATIO = 1.5;
const VISIBILITY_THRESHOLD = 0.1;
const TIME_STEP = 0.01;
/** Idle tumble: revolutions per unit of `state.time`. */
const ROTATION_SPEED = 0.03;

export interface InvestorsFoundersScene {
  init(): void;
  destroy(): void;
}

interface MorphState {
  visible: boolean;
  time: number;
  currentScrollProgress: number;
  hasStartedMorphing: boolean;
  capturedRotationX: number | null;
  capturedRotationY: number | null;
  capturedRotationZ: number | null;
  baseRotationX: number;
  baseRotationY: number;
  baseRotationZ: number;
  ROTATION_SPEED: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function scatter(value: number, direction: number, amount: number): number {
  return value + direction * amount * SCATTER_DISTANCE;
}

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function radToDeg(radians: number): number {
  return (180 * radians) / Math.PI;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Five stacked plane grids, flattened into one interleaved position array. */
function buildStackedPlanePositions(): number[] {
  const positions: number[] = [];
  const step = PLANE_WIDTH / (PLANE_COUNT - 1);
  const start = -PLANE_WIDTH / 2;

  for (let i = 0; i < PLANE_COUNT; i++) {
    const plane = new THREE.PlaneGeometry(
      PLANE_WIDTH,
      PLANE_HEIGHT,
      PLANE_WIDTH_SEGMENTS,
      PLANE_HEIGHT_SEGMENTS,
    );
    const offset = start + i * step;
    const source = plane.attributes.position.array;

    for (let a = 0; a < source.length; a += 3) {
      let x = source[a];
      let y = source[a + 1];
      let z = source[a + 2];
      if (STACK_AXIS === "x") x += offset;
      else if (STACK_AXIS === "y") y += offset;
      else if (STACK_AXIS === "z") z += offset;
      positions.push(x, y, z);
    }
    plane.dispose();
  }

  return positions;
}

/**
 * Pads the shorter array so both morph endpoints have the same vertex count.
 *
 * The index arithmetic in the original always resolves to 0 (both lengths are
 * multiples of 3), so this repeats vertex 0 rather than cycling. Reproduced
 * verbatim: the padded vertices sit at the shape's first point and are
 * invisible in the final render.
 */
function padToMatch(a: number[], b: number[]): void {
  const target = Math.max(a.length, b.length);
  while (a.length < target) {
    const i = a.length % (a.length - (a.length % 3)) || 0;
    a.push(a[i], a[i + 1], a[i + 2]);
  }
  while (b.length < target) {
    const i = b.length % (b.length - (b.length % 3)) || 0;
    b.push(b[i], b[i + 1], b[i + 2]);
  }
}

interface MorphGeometry {
  init(): void;
  morph(progress: number, scatterAmount: number): void;
  setRotation(xDeg: number, yDeg: number, zDeg: number): void;
  setPosition(x: number, y: number, z: number): void;
  setOpacity(value: number): void;
  getRotation(): THREE.Euler | null;
  destroy(): void;
}

function createMorphGeometry(scene: THREE.Scene): MorphGeometry {
  let points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null =
    null;
  let geometry: THREE.BufferGeometry | null = null;
  let fromPositions: number[] = [];
  let toPositions: number[] = [];
  let scatterDirections: { x: number; y: number; z: number }[] = [];

  function cleanup() {
    if (points) {
      points.geometry.dispose();
      points.material.dispose();
      scene.remove(points);
      points = null;
      geometry = null;
    }
  }

  return {
    init() {
      cleanup();

      fromPositions = buildStackedPlanePositions();

      const cylinder = new THREE.CylinderGeometry(
        CYLINDER_RADIUS_TOP,
        CYLINDER_RADIUS_BOTTOM,
        CYLINDER_HEIGHT,
        CYLINDER_RADIAL_SEGMENTS,
        CYLINDER_HEIGHT_SEGMENTS,
        true,
      );
      toPositions = Array.from(cylinder.attributes.position.array);
      cylinder.dispose();

      padToMatch(fromPositions, toPositions);

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(fromPositions), 3),
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
              opacity: { value: 1 },
            },
          ]),
          vertexShader: POINTS_FOG_VERT,
          fragmentShader: POINTS_FOG_OPACITY_FRAG,
          fog: true,
          transparent: true,
        }),
      );

      points.rotation.set(
        degToRad(START_ROTATION_DEG.x),
        degToRad(START_ROTATION_DEG.y),
        degToRad(START_ROTATION_DEG.z),
      );
      points.position.set(
        START_POSITION.x,
        START_POSITION.y,
        START_POSITION.z,
      );
      scene.add(points);

      const vertexCount = fromPositions.length / 3;
      scatterDirections = [];
      for (let i = 0; i < vertexCount; i++) {
        scatterDirections.push({
          x: 2 * (Math.random() - 0.5),
          y: 2 * (Math.random() - 0.5),
          z: 2 * (Math.random() - 0.5),
        });
      }
    },

    morph(progress, scatterAmount) {
      if (!geometry) return;

      const target = geometry.attributes.position.array as Float32Array;
      for (let a = 0; a < target.length; a += 3) {
        const x =
          fromPositions[a] + (toPositions[a] - fromPositions[a]) * progress;
        const y =
          fromPositions[a + 1] +
          (toPositions[a + 1] - fromPositions[a + 1]) * progress;
        const z =
          fromPositions[a + 2] +
          (toPositions[a + 2] - fromPositions[a + 2]) * progress;

        if (scatterAmount > 0) {
          const dir = scatterDirections[Math.floor(a / 3)] || {
            x: 0,
            y: 0,
            z: 0,
          };
          target[a] = scatter(x, dir.x, scatterAmount);
          target[a + 1] = scatter(y, dir.y, scatterAmount);
          target[a + 2] = scatter(z, dir.z, scatterAmount);
        } else {
          target[a] = x;
          target[a + 1] = y;
          target[a + 2] = z;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    },

    setRotation(xDeg, yDeg, zDeg) {
      if (points) {
        points.rotation.set(degToRad(xDeg), degToRad(yDeg), degToRad(zDeg));
      }
    },

    setPosition(x, y, z) {
      if (points) points.position.set(x, y, z);
    },

    setOpacity(value) {
      if (points) points.material.uniforms.opacity.value = value;
    },

    getRotation() {
      return points ? points.rotation : null;
    },

    destroy() {
      cleanup();
      fromPositions = [];
      toPositions = [];
      scatterDirections = [];
    },
  };
}

interface ScrollController {
  init(): void;
  destroy(): void;
}

function createScrollController(options: {
  wrapper: HTMLElement;
  camera: THREE.PerspectiveCamera;
  morphGeometry: MorphGeometry;
  state: MorphState;
}): ScrollController {
  const { wrapper, camera, morphGeometry, state } = options;

  let pinTrigger: ScrollTrigger | null = null;
  let morphTrigger: ScrollTrigger | null = null;
  let cameraTrigger: ScrollTrigger | null = null;

  function applyMorph(progress: number) {
    const eased = easeInOutCubic(progress);
    // Triangular-ish falloff peaking at SCATTER_PEAK: particles blow apart in
    // the middle of the morph and reassemble at either end.
    const distance = Math.abs(eased - SCATTER_PEAK);
    const range = Math.max(SCATTER_PEAK, 1 - SCATTER_PEAK);
    const amount = 1 - Math.pow(distance / range, 2);

    morphGeometry.setOpacity(1 - 0.5 * amount);
    morphGeometry.morph(eased, amount);
  }

  function captureRotation(progress: number) {
    const rotation = morphGeometry.getRotation();
    if (!rotation) return;

    if (progress === 0 && state.hasStartedMorphing) {
      state.hasStartedMorphing = false;
      // Hand the idle tumble back its clock at the angle the morph left off,
      // so scrolling back to the top doesn't snap the rotation.
      const degrees =
        ((rotation.x + rotation.y + rotation.z) / 3) * (180 / Math.PI);
      state.time = degrees / (360 * state.ROTATION_SPEED);
    }

    if (progress > 0 && !state.hasStartedMorphing) {
      state.hasStartedMorphing = true;
      state.capturedRotationX = radToDeg(rotation.x);
      state.capturedRotationY = radToDeg(rotation.y);
      state.capturedRotationZ = radToDeg(rotation.z);
    }
  }

  function onMorphUpdate(self: ScrollTrigger) {
    state.currentScrollProgress = self.progress;
    captureRotation(self.progress);

    const eased = easeInOutCubic(self.progress);
    const fromX = state.capturedRotationX ?? state.baseRotationX;
    const fromY = state.capturedRotationY ?? state.baseRotationY;
    const fromZ = state.capturedRotationZ ?? state.baseRotationZ;

    state.baseRotationX = lerp(fromX, END_ROTATION_DEG.x, eased);
    state.baseRotationY = lerp(fromY, END_ROTATION_DEG.y, eased);
    state.baseRotationZ = lerp(fromZ, END_ROTATION_DEG.z, eased);

    morphGeometry.setPosition(
      lerp(START_POSITION.x, END_POSITION.x, eased),
      lerp(START_POSITION.y, END_POSITION.y, eased),
      lerp(START_POSITION.z, END_POSITION.z, eased),
    );

    applyMorph(self.progress);
  }

  return {
    init() {
      pinTrigger = ScrollTrigger.create({
        trigger: "#investors-founders",
        start: "top top",
        end: "bottom bottom",
        pin: wrapper,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });

      morphTrigger = ScrollTrigger.create({
        trigger: "#founders-section",
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate: onMorphUpdate,
        invalidateOnRefresh: true,
      });

      cameraTrigger = ScrollTrigger.create({
        trigger: "#founders-section",
        start: "top top",
        end: "bottom+=600px bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          const eased = easeInOutCubic(self.progress);
          const mobileOffset =
            window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_CAMERA_Z_OFFSET : 0;
          camera.position.z =
            CAMERA_Z_START +
            mobileOffset +
            (CAMERA_Z_END - CAMERA_Z_START) * eased;
          camera.position.y = lerp(CAMERA_Y, CAMERA_Y_END, eased);
        },
        invalidateOnRefresh: true,
      });
    },

    destroy() {
      if (pinTrigger) {
        pinTrigger.kill();
        pinTrigger = null;
      }
      if (morphTrigger) {
        morphTrigger.kill();
        morphTrigger = null;
      }
      if (cameraTrigger) {
        cameraTrigger.kill();
        cameraTrigger = null;
      }
    },
  };
}

export function createInvestorsFoundersScene(
  canvas: HTMLCanvasElement,
  wrapper: HTMLElement,
): InvestorsFoundersScene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let morphGeometry: MorphGeometry | null = null;
  let scrollController: ScrollController | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let lastWidth = 0;
  let frame = 0;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const state: MorphState = {
    visible: false,
    time: 0,
    currentScrollProgress: 0,
    hasStartedMorphing: false,
    capturedRotationX: null,
    capturedRotationY: null,
    capturedRotationZ: null,
    baseRotationX: START_ROTATION_DEG.x,
    baseRotationY: START_ROTATION_DEG.y,
    baseRotationZ: START_ROTATION_DEG.z,
    ROTATION_SPEED,
  };

  function cameraDistance(): number {
    return (
      CAMERA_Z_START +
      (window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_CAMERA_Z_OFFSET : 0)
    );
  }

  function animate() {
    frame = requestAnimationFrame(animate);
    if (!state.visible || reducedMotion) return;
    if (!renderer || !scene || !camera || !morphGeometry) return;

    state.time += TIME_STEP;

    if (state.currentScrollProgress !== 0 || state.hasStartedMorphing) {
      morphGeometry.setRotation(
        state.baseRotationX,
        state.baseRotationY,
        state.baseRotationZ,
      );
    } else {
      // Idle tumble before the scroll takes over: equal rotation on all axes.
      const angle = ((ROTATION_SPEED * state.time * 360) % 360);
      morphGeometry.setRotation(angle, angle, angle);
    }

    renderer.render(scene, camera);
  }

  return {
    init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        window.innerWidth / window.innerHeight,
        CAMERA_NEAR,
        CAMERA_FAR,
      );
      camera.position.x = CAMERA_X;
      camera.position.y = CAMERA_Y;
      camera.position.z = cameraDistance();

      renderer = new THREE.WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Capped lower than the other scenes -- this one rewrites every vertex
      // each frame, so fill rate matters more than crispness.
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
      );
      renderer.setClearColor(CLEAR_COLOR, 1);

      scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

      morphGeometry = createMorphGeometry(scene);
      morphGeometry.init();

      if (!reducedMotion) {
        scrollController = createScrollController({
          wrapper,
          camera,
          morphGeometry,
          state,
        });
        scrollController.init();
      }

      observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0].isIntersecting;
        },
        { threshold: VISIBILITY_THRESHOLD },
      );
      observer.observe(canvas);

      lastWidth = window.innerWidth;
      onResize = () => {
        const width = window.innerWidth;
        if (width === lastWidth) return;
        lastWidth = width;
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = cameraDistance();
      };
      window.addEventListener("resize", onResize);

      animate();
    },

    destroy() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (onResize) {
        window.removeEventListener("resize", onResize);
        onResize = null;
      }
      if (scrollController) {
        scrollController.destroy();
        scrollController = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (morphGeometry) {
        morphGeometry.destroy();
        morphGeometry = null;
      }
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }
      if (scene) {
        scene.clear();
        scene = null;
      }
      camera = null;
    },
  };
}
