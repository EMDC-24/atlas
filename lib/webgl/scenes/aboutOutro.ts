"use client";

/**
 * ABOUT OUTRO scene (`Qa` in the original bundle, call site: `aboutOutro`).
 *
 * A point cloud that starts as a stack of five subdivided planes and morphs
 * into an open cylinder as `#outro` scrolls through. Three ScrollTriggers drive
 * it: one pins the canvas wrapper, one scrubs the morph/rotation, and a third
 * (scrub 1.5, so it lags the morph) dollies the camera in.
 *
 * Shader variant: POINTS_FOG_VERT + POINTS_FOG_OPACITY_FRAG -- this is the only
 * one of the four scenes that fades its particles, so it needs the `opacity`
 * uniform and `transparent: true`.
 */

import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";
import { POINTS_FOG_OPACITY_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

/** Camera. `CAMERA_Y_START`/`CAMERA_Y_END` are both 0 in the original -- the
 *  lerp is a no-op but is kept so the tuning surface matches. */
const CAMERA_X = 0;
const CAMERA_Y_START = 0;
const CAMERA_Y_END = 0;
const CAMERA_Z_START = 16;
const CAMERA_Z_END = 4;
const CAMERA_FOV = 60;

/** Source shape: five stacked planes. */
const PLANE_WIDTH = 8;
const PLANE_HEIGHT = 10;
const PLANE_WIDTH_SEGMENTS = 20;
const PLANE_HEIGHT_SEGMENTS = 20;
const PLANE_COUNT = 5;
const STACK_AXIS: "x" | "y" | "z" = "z";

const PARTICLE_COLOR = 13750737; // 0xd1d1d1
const PARTICLE_SIZE = 0.35;
const PARTICLE_SIZE_ATTENUATION = 170;

/** Rotation/position keyframes, in degrees / world units. */
const ROTATION_START = { x: 0, y: 90, z: 0 };
const ROTATION_END = { x: 90, y: 0, z: 0 };
const POSITION_START = { x: 0, y: 0, z: 0 };
const POSITION_END = { x: 0, y: 0, z: 8 };

/** Target shape: an open-ended cylinder with matching-ish vertex count. */
const CYLINDER_RADIUS_TOP = 3;
const CYLINDER_RADIUS_BOTTOM = 3;
const CYLINDER_HEIGHT = 30;
const CYLINDER_RADIAL_SEGMENTS = 50;
const CYLINDER_HEIGHT_SEGMENTS = 20;

/** How far a particle can stray from its interpolated position mid-morph. */
const SCATTER_STRENGTH = 2;
/** Progress at which the scatter (and the 50% opacity dip) peaks. */
const SCATTER_PEAK = 0.5;

const FOG_NEAR = 0;
const FOG_FAR = 25;
const FOG_COLOR = 14342874; // 0xdadada

const ROTATION_SPEED = 0.03;

/** Extra camera pull-back below 768px so the shape still fits the viewport. */
const MOBILE_BREAKPOINT = 768;
const MOBILE_CAMERA_Z_OFFSET = 5;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function scatter(base: number, offset: number, amount: number): number {
  return base + offset * amount * SCATTER_STRENGTH;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (180 * rad) / Math.PI;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
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

interface MorphGeometry {
  init(): void;
  morph(progress: number, scatterAmount: number): void;
  setRotation(x: number, y: number, z: number): void;
  setPosition(x: number, y: number, z: number): void;
  setOpacity(value: number): void;
  getRotation(): THREE.Euler | null;
  destroy(): void;
}

/**
 * Pads the shorter of two flat xyz arrays by repeating earlier vertices, so
 * source and target have identical lengths and can be lerped index-by-index.
 * The index expression is transcribed verbatim from the bundle: for arrays
 * shorter than 3 the modulus divides by zero and the `|| 0` catches the NaN.
 */
function padToMatch(a: number[], b: number[]): void {
  const max = Math.max(a.length, b.length);
  while (a.length < max) {
    const i = a.length % (a.length - (a.length % 3)) || 0;
    a.push(a[i], a[i + 1], a[i + 2]);
  }
  while (b.length < max) {
    const i = b.length % (b.length - (b.length % 3)) || 0;
    b.push(b[i], b[i + 1], b[i + 2]);
  }
}

function buildStackedPlanes(): number[] {
  const positions: number[] = [];
  // Spacing is derived from PLANE_WIDTH even though the stack runs along z.
  const spacing = PLANE_WIDTH / (PLANE_COUNT - 1);
  const start = -PLANE_WIDTH / 2;

  for (let i = 0; i < PLANE_COUNT; i++) {
    const plane = new THREE.PlaneGeometry(
      PLANE_WIDTH,
      PLANE_HEIGHT,
      PLANE_WIDTH_SEGMENTS,
      PLANE_HEIGHT_SEGMENTS,
    );
    const offset = start + i * spacing;
    const array = plane.attributes.position.array;

    for (let a = 0; a < array.length; a += 3) {
      let x = array[a];
      let y = array[a + 1];
      let z = array[a + 2];
      if (STACK_AXIS === "x") x += offset;
      else if (STACK_AXIS === "y") y += offset;
      else if (STACK_AXIS === "z") z += offset;
      positions.push(x, y, z);
    }

    plane.dispose();
  }

  return positions;
}

function buildCylinder(): number[] {
  const cylinder = new THREE.CylinderGeometry(
    CYLINDER_RADIUS_TOP,
    CYLINDER_RADIUS_BOTTOM,
    CYLINDER_HEIGHT,
    CYLINDER_RADIAL_SEGMENTS,
    CYLINDER_HEIGHT_SEGMENTS,
    true,
  );
  const positions = Array.from(cylinder.attributes.position.array);
  cylinder.dispose();
  return positions;
}

function randomOffsets(count: number): Vec3[] {
  const offsets: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push({
      x: 2 * (Math.random() - 0.5),
      y: 2 * (Math.random() - 0.5),
      z: 2 * (Math.random() - 0.5),
    });
  }
  return offsets;
}

function createMorphGeometry(scene: THREE.Scene): MorphGeometry {
  let points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null =
    null;
  let geometry: THREE.BufferGeometry | null = null;
  let sourcePositions: number[] = [];
  let targetPositions: number[] = [];
  let offsets: Vec3[] = [];

  function disposePoints(): void {
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
      disposePoints();

      sourcePositions = buildStackedPlanes();
      targetPositions = buildCylinder();
      padToMatch(sourcePositions, targetPositions);

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(sourcePositions), 3),
      );

      const material = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            color: { value: new THREE.Color(PARTICLE_COLOR) },
            size: { value: PARTICLE_SIZE },
            sizeAttenuation: { value: PARTICLE_SIZE_ATTENUATION },
            opacity: { value: 1 },
          },
        ]),
        vertexShader: POINTS_FOG_VERT,
        fragmentShader: POINTS_FOG_OPACITY_FRAG,
        fog: true,
        transparent: true,
      });

      points = new THREE.Points(geometry, material);
      points.rotation.set(
        degToRad(ROTATION_START.x),
        degToRad(ROTATION_START.y),
        degToRad(ROTATION_START.z),
      );
      points.position.set(POSITION_START.x, POSITION_START.y, POSITION_START.z);
      scene.add(points);

      offsets = randomOffsets(sourcePositions.length / 3);
    },

    morph(progress: number, scatterAmount: number) {
      if (!geometry) return;
      const array = (geometry.attributes.position as THREE.BufferAttribute)
        .array as Float32Array;

      for (let a = 0; a < array.length; a += 3) {
        const x = lerp(sourcePositions[a], targetPositions[a], progress);
        const y = lerp(sourcePositions[a + 1], targetPositions[a + 1], progress);
        const z = lerp(sourcePositions[a + 2], targetPositions[a + 2], progress);

        if (scatterAmount > 0) {
          const offset = offsets[Math.floor(a / 3)] || { x: 0, y: 0, z: 0 };
          array[a] = scatter(x, offset.x, scatterAmount);
          array[a + 1] = scatter(y, offset.y, scatterAmount);
          array[a + 2] = scatter(z, offset.z, scatterAmount);
        } else {
          array[a] = x;
          array[a + 1] = y;
          array[a + 2] = z;
        }
      }

      geometry.attributes.position.needsUpdate = true;
    },

    setRotation(x: number, y: number, z: number) {
      if (points) {
        points.rotation.set(degToRad(x), degToRad(y), degToRad(z));
      }
    },

    setPosition(x: number, y: number, z: number) {
      if (points) points.position.set(x, y, z);
    },

    setOpacity(value: number) {
      if (points) points.material.uniforms.opacity.value = value;
    },

    getRotation() {
      return points ? points.rotation : null;
    },

    destroy() {
      disposePoints();
      sourcePositions = [];
      targetPositions = [];
      offsets = [];
    },
  };
}

interface ScrollController {
  init(): void;
  destroy(): void;
}

function createScrollController(config: {
  wrapper: HTMLElement;
  camera: THREE.PerspectiveCamera;
  morphGeometry: MorphGeometry;
  state: MorphState;
}): ScrollController {
  const { wrapper, camera, morphGeometry, state } = config;

  let pinTrigger: ScrollTrigger | null = null;
  let morphTrigger: ScrollTrigger | null = null;
  let cameraTrigger: ScrollTrigger | null = null;

  function applyMorph(progress: number): void {
    const eased = easeInOutCubic(progress);
    // Parabolic bump peaking at SCATTER_PEAK: particles scatter and dim to 50%
    // at the midpoint of the morph, then reconverge.
    const distance = Math.abs(eased - SCATTER_PEAK);
    const range = Math.max(SCATTER_PEAK, 1 - SCATTER_PEAK);
    const bump = 1 - Math.pow(distance / range, 2);

    morphGeometry.setOpacity(1 - 0.5 * bump);
    morphGeometry.morph(eased, bump);
  }

  function captureRotation(progress: number): void {
    const rotation = morphGeometry.getRotation();
    if (!rotation) return;

    if (progress === 0 && state.hasStartedMorphing) {
      state.hasStartedMorphing = false;
      // Rewind the idle spin clock so it resumes from the current angle.
      const degrees = ((rotation.x + rotation.y + rotation.z) / 3) * (180 / Math.PI);
      state.time = degrees / (360 * state.ROTATION_SPEED);
    }

    if (progress > 0 && !state.hasStartedMorphing) {
      state.hasStartedMorphing = true;
      state.capturedRotationX = radToDeg(rotation.x);
      state.capturedRotationY = radToDeg(rotation.y);
      state.capturedRotationZ = radToDeg(rotation.z);
    }
  }

  function onUpdate(self: ScrollTrigger): void {
    const progress = self.progress;
    state.currentScrollProgress = progress;
    captureRotation(progress);

    const eased = easeInOutCubic(progress);
    const fromX = state.capturedRotationX ?? state.baseRotationX;
    const fromY = state.capturedRotationY ?? state.baseRotationY;
    const fromZ = state.capturedRotationZ ?? state.baseRotationZ;
    state.baseRotationX = lerp(fromX, ROTATION_END.x, eased);
    state.baseRotationY = lerp(fromY, ROTATION_END.y, eased);
    state.baseRotationZ = lerp(fromZ, ROTATION_END.z, eased);

    morphGeometry.setPosition(
      lerp(POSITION_START.x, POSITION_END.x, eased),
      lerp(POSITION_START.y, POSITION_END.y, eased),
      lerp(POSITION_START.z, POSITION_END.z, eased),
    );

    applyMorph(progress);
  }

  return {
    init() {
      pinTrigger = ScrollTrigger.create({
        trigger: "#outro",
        start: "top top",
        end: "bottom bottom",
        pin: wrapper,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });

      morphTrigger = ScrollTrigger.create({
        trigger: "#outro",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate,
        invalidateOnRefresh: true,
      });

      // Scrub 1.5 makes the dolly trail the morph rather than track it exactly.
      cameraTrigger = ScrollTrigger.create({
        trigger: "#outro",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate(self) {
          const eased = easeInOutCubic(self.progress);
          const mobileOffset =
            window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_CAMERA_Z_OFFSET : 0;
          camera.position.z =
            CAMERA_Z_START + mobileOffset + (CAMERA_Z_END - CAMERA_Z_START) * eased;
          camera.position.y = lerp(CAMERA_Y_START, CAMERA_Y_END, eased);
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

export interface Scene {
  init(): void;
  destroy(): void;
}

export function createAboutOutroScene(
  canvas: HTMLCanvasElement,
  canvasWrapper: HTMLElement,
): Scene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let morphGeometry: MorphGeometry | null = null;
  let scrollController: ScrollController | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let previousWidth = 0;
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
    baseRotationX: ROTATION_START.x,
    baseRotationY: ROTATION_START.y,
    baseRotationZ: ROTATION_START.z,
    ROTATION_SPEED,
  };

  function cameraZ(): number {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    return CAMERA_Z_START + (isMobile ? MOBILE_CAMERA_Z_OFFSET : 0);
  }

  function animate(): void {
    frame = requestAnimationFrame(animate);
    if (!state.visible || reducedMotion) return;
    if (!renderer || !scene || !camera || !morphGeometry) return;

    state.time += 0.01;

    if (state.currentScrollProgress !== 0 || state.hasStartedMorphing) {
      // Scroll owns the rotation once the morph has begun.
      morphGeometry.setRotation(
        state.baseRotationX,
        state.baseRotationY,
        state.baseRotationZ,
      );
    } else {
      // Idle tumble: equal angle on all three axes, wrapped to 0-360.
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
        0.1,
        1000,
      );
      camera.position.x = CAMERA_X;
      camera.position.y = CAMERA_Y_START;
      camera.position.z = cameraZ();

      renderer = new THREE.WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0, 0);

      scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

      morphGeometry = createMorphGeometry(scene);
      morphGeometry.init();

      if (!reducedMotion) {
        scrollController = createScrollController({
          wrapper: canvasWrapper,
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
        { threshold: 0.1 },
      );
      observer.observe(canvas);

      previousWidth = window.innerWidth;
      onResize = () => {
        const width = window.innerWidth;
        // Width-only check: ignores mobile URL-bar height changes.
        if (width === previousWidth) return;
        previousWidth = width;
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = cameraZ();
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
