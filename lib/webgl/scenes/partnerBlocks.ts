"use client";

/**
 * PARTNER BLOCKS scene (`cu` in the original bundle, call site: `partnerBlocks`
 * on the why-wqf section).
 *
 * Same morph idea as the about outro -- five stacked planes of particles that
 * scrub into an open cylinder -- but sized to sit inside a block rather than
 * fill the viewport: it reads its size from the canvas' parent element, tracks
 * it with a ResizeObserver, and paints an opaque #111111 background instead of
 * being transparent. The second argument is the `#partnerBlocks` section that
 * drives the ScrollTrigger.
 *
 * Shader variant: POINTS_FOG_VERT + POINTS_FOG_OPACITY_FRAG (the morph dips the
 * particles to 50% opacity at its midpoint).
 */

import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";
import { POINTS_FOG_OPACITY_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const ROTATION_SPEED = 0.03;

const CAMERA_X = 0;
const CAMERA_Y = 0;
const CAMERA_Z = 16;
const CAMERA_FOV = 60;

/** Source shape: five stacked planes. */
const PLANE_WIDTH = 8;
const PLANE_HEIGHT = 10;
const PLANE_WIDTH_SEGMENTS = 20;
const PLANE_HEIGHT_SEGMENTS = 20;
const PLANE_COUNT = 5;
const STACK_AXIS: "x" | "y" | "z" = "z";

const PARTICLE_COLOR = 13750737; // 0xd1d1d1
const PARTICLE_SIZE = 0.2;
const PARTICLE_SIZE_ATTENUATION = 170;

const ROTATION_START = { x: 0, y: 90, z: 0 };
const ROTATION_END = { x: 90, y: 0, z: 0 };
const POSITION_START = { x: 0, y: 0, z: 0 };
const POSITION_END = { x: 0, y: 0, z: 8 };

/** Target shape: an open-ended cylinder. */
const CYLINDER_RADIUS_TOP = 3;
const CYLINDER_RADIUS_BOTTOM = 3;
const CYLINDER_HEIGHT = 30;
const CYLINDER_RADIAL_SEGMENTS = 50;
const CYLINDER_HEIGHT_SEGMENTS = 20;

const SCATTER_STRENGTH = 2;
const SCATTER_PEAK = 0.5;

const FOG_NEAR = 0;
const FOG_FAR = 25;
/** Doubles as the renderer clear colour, so fog fades into the background. */
const BACKGROUND_COLOR = 1118481; // 0x111111

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

/** See aboutOutro: index maths transcribed verbatim, including the `|| 0`. */
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
  // Spacing derives from PLANE_WIDTH even though the stack runs along z.
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
  section: Element;
  morphGeometry: MorphGeometry;
  state: MorphState;
}): ScrollController {
  const { section, morphGeometry, state } = config;
  let trigger: ScrollTrigger | null = null;

  function applyMorph(progress: number): void {
    const eased = easeInOutCubic(progress);
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
      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        end: "bottom center",
        scrub: true,
        onUpdate,
        invalidateOnRefresh: true,
      });
    },

    destroy() {
      if (trigger) {
        trigger.kill();
        trigger = null;
      }
    },
  };
}

export interface Scene {
  init(): void;
  destroy(): void;
}

export function createPartnerBlocksScene(
  canvas: HTMLCanvasElement,
  section: Element | null,
): Scene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let morphGeometry: MorphGeometry | null = null;
  let scrollController: ScrollController | null = null;
  let observer: IntersectionObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
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

  /** The canvas is sized by its parent block, not the viewport. */
  function containerSize(): { width: number; height: number } {
    const parent = canvas.parentElement;
    return {
      width: parent ? parent.clientWidth : 0,
      height: parent ? parent.clientHeight : 0,
    };
  }

  function animate(): void {
    frame = requestAnimationFrame(animate);
    if (!state.visible || reducedMotion) return;
    if (!renderer || !scene || !camera || !morphGeometry) return;

    state.time += 0.01;

    if (state.currentScrollProgress !== 0 || state.hasStartedMorphing) {
      morphGeometry.setRotation(
        state.baseRotationX,
        state.baseRotationY,
        state.baseRotationZ,
      );
    } else {
      // Idle tumble: the same angle on all three axes, wrapped to 0-360.
      const angle = (state.time * ROTATION_SPEED * 360) % 360;
      morphGeometry.setRotation(angle, angle, angle);
    }

    renderer.render(scene, camera);
  }

  return {
    init() {
      scene = new THREE.Scene();

      const { width, height } = containerSize();
      camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 1000);
      camera.position.x = CAMERA_X;
      camera.position.y = CAMERA_Y;
      camera.position.z = CAMERA_Z;

      const rendererSize = containerSize();
      renderer = new THREE.WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: true,
      });
      renderer.setSize(rendererSize.width, rendererSize.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(BACKGROUND_COLOR, 1);

      scene.fog = new THREE.Fog(BACKGROUND_COLOR, FOG_NEAR, FOG_FAR);

      morphGeometry = createMorphGeometry(scene);
      morphGeometry.init();

      if (!reducedMotion && section) {
        scrollController = createScrollController({
          section,
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

      resizeObserver = new ResizeObserver(() => {
        const size = containerSize();
        if (!camera || !renderer) return;
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
        renderer.setSize(size.width, size.height);
      });
      if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

      animate();
    },

    destroy() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
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
