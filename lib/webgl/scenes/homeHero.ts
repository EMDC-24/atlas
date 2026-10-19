"use client";

/**
 * Home hero.
 *
 * A horizontal `TubeGeometry` (a straight tube, because `arcHeight` is 0)
 * rendered as `THREE.Points`. Every frame the vertices are pushed off their
 * original positions by two sine fields, and on pointer devices the cursor
 * shoves nearby particles away.
 *
 * The tube sits far off-centre (x 4.9, z 36) and is rotated ~117deg on Y so the
 * camera looks down its length: what reads on screen is a drifting cloud of
 * dots, not a recognisable tube.
 *
 * Fog near 0 / far 15 with a camera at z 50 means the whole tube is inside the
 * fog ramp -- that depth fade is a large part of the look, so the fogged shader
 * variant is required.
 */

import * as THREE from "three";

import { gsap } from "@/lib/gsap";
import { POINTS_FOG_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_POSITION = { x: 0, y: 0, z: 50 };

const CLEAR_COLOR = 0x111111;
const FOG_COLOR = 0x111111;
const FOG_NEAR = 0;
const FOG_FAR = 15;

const TUBE = {
  radius: 1.5,
  tubularSegments: 60,
  radialSegments: 60,
  arcHeight: 0,
  arcLength: 22,
  position: { x: 4.9, y: -1.6, z: 36 },
  rotation: { x: 0, y: -117, z: 11 },
  mobilePosition: { x: 4.9, y: -1.6, z: 34 },
  mobileRotation: { x: 0, y: -117, z: 11 },
} as const;

const PARTICLE_COLOR = 13750737; // 0xd1d1d1
const PARTICLE_SIZE = 0.2;
/** Divisor for the perspective point-size falloff in the vertex shader. */
const SIZE_ATTENUATION = 170;

const MOBILE_BREAKPOINT = 768;

/** Per-axis frequencies of the drift field. Deliberately unequal so the three
 *  axes never fall into phase and the cloud never looks like it is pulsing. */
const WAVE_FREQ_X = 0.01;
const WAVE_FREQ_Y = 0.015;
const WAVE_FREQ_Z = 0.02;

/** Cursor influence radius, in CSS pixels on the canvas. */
const MOUSE_RADIUS = 125;
/** How far a particle at the very centre of the cursor gets pushed. */
const MOUSE_STRENGTH = 1.5;
/** Z push is half the in-plane push, so particles lift towards the camera. */
const MOUSE_Z_FACTOR = 0.5;
/** Lerp factor applied to the offsets each frame -- the "spring" feel. */
const MOUSE_SMOOTHING = 0.1;

/** The intro explodes the tube: intensity 30 collapsing to a 0.02 idle drift. */
const INTRO_WAVE_INTENSITY = 30;
const IDLE_WAVE_INTENSITY = 0.02;
const INTRO_DURATION = 2;
const INTRO_DELAY = 2;
const INTRO_EASE = "power3.inOut";
const SPATIAL_BLEND_DURATION = 1.5;
const SPATIAL_BLEND_EASE = "power2.inOut";

/** Fixed timestep -- the animation is frame-count driven, not clock driven. */
const TIME_STEP = 0.01;

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * One axis of the drift field. `useCos` swaps the inner trig function so the
 * Y axis is out of phase with X and Z.
 */
function waveComponent(
  time: number,
  seed: number,
  frequency: number,
  useCos: boolean,
): number {
  const trig = useCos ? Math.cos : Math.sin;
  return 0.5 * Math.sin(trig(time + seed * frequency) * Math.PI);
}

interface WaveOffset {
  x: number;
  y: number;
  z: number;
}

function waveOffset(
  time: number,
  seedX: number,
  seedY: number,
  seedZ: number,
): WaveOffset {
  return {
    x: waveComponent(time, seedX, WAVE_FREQ_X, false),
    y: waveComponent(time, seedY, WAVE_FREQ_Y, true),
    z: waveComponent(time, seedZ, WAVE_FREQ_Z, false),
  };
}

/**
 * Writes one vertex: original position + drift * intensity + cursor offset.
 * Touch devices skip the cursor term entirely.
 */
function applyVertex(
  target: Float32Array,
  index: number,
  original: Float32Array,
  offset: WaveOffset,
  intensity: number,
  mouseOffsets: Float32Array,
  isTouchDevice: boolean,
): void {
  target[index] =
    original[index] +
    offset.x * intensity +
    (isTouchDevice ? 0 : mouseOffsets[index]);
  target[index + 1] =
    original[index + 1] +
    offset.y * intensity +
    (isTouchDevice ? 0 : mouseOffsets[index + 1]);
  target[index + 2] =
    original[index + 2] +
    offset.z * intensity +
    (isTouchDevice ? 0 : mouseOffsets[index + 2]);
}

type TubePoints = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

interface TubeController {
  create(): void;
  updateTransform(): void;
  getGeometry(): THREE.BufferGeometry | null;
  getOriginalPositions(): Float32Array | null;
  getMatrixWorld(): THREE.Matrix4 | null;
  destroy(): void;
}

function createTube(scene: THREE.Scene): TubeController {
  let points: TubePoints | null = null;
  let originalPositions: Float32Array | null = null;
  // Sampled once at construction, matching the original -- `create()` uses this
  // snapshot while `updateTransform()` re-reads the viewport on every resize.
  const isMobileAtCreate = window.innerWidth < MOBILE_BREAKPOINT;

  return {
    create() {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-TUBE.arcLength / 2, 0, 0),
        new THREE.Vector3(0, TUBE.arcHeight, 0),
        new THREE.Vector3(TUBE.arcLength / 2, 0, 0),
      );
      const geometry = new THREE.TubeGeometry(
        curve,
        TUBE.tubularSegments,
        TUBE.radius,
        TUBE.radialSegments,
        false,
      );
      const material = new THREE.ShaderMaterial({
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
      });

      points = new THREE.Points(geometry, material);

      const position = isMobileAtCreate ? TUBE.mobilePosition : TUBE.position;
      const rotation = isMobileAtCreate ? TUBE.mobileRotation : TUBE.rotation;
      points.position.set(position.x, position.y, position.z);
      points.rotation.set(
        degToRad(rotation.x),
        degToRad(rotation.y),
        degToRad(rotation.z),
      );
      scene.add(points);

      originalPositions = new Float32Array(
        (points.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array,
      );
    },

    updateTransform() {
      if (!points) return;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const position = isMobile ? TUBE.mobilePosition : TUBE.position;
      const rotation = isMobile ? TUBE.mobileRotation : TUBE.rotation;
      points.position.set(position.x, position.y, position.z);
      points.rotation.set(
        degToRad(rotation.x),
        degToRad(rotation.y),
        degToRad(rotation.z),
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

interface InteractionOptions {
  tube: TubeController;
  camera: THREE.PerspectiveCamera;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
  canvas: HTMLCanvasElement | null;
}

interface Interaction {
  init(): void;
  /** Resolves when the collapse tween finishes; the caller ignores it. */
  startIntroAnimation(): Promise<unknown>;
  skipToEnd(): void;
  updateWavePositions(time: number): void;
  handleMouseMove(event: MouseEvent): void;
  isIntroComplete(): boolean;
  destroy(): void;
}

function createInteraction({
  tube,
  camera,
  isTouchDevice,
  prefersReducedMotion,
  canvas,
}: InteractionOptions): Interaction {
  let worldVector: THREE.Vector3 | null = null;
  let projectedVector: THREE.Vector3 | null = null;
  const mouse = { x: 0, y: 0 };
  /** Target cursor offsets for this frame. */
  let targetOffsets: Float32Array | null = null;
  /** Smoothed offsets actually applied to the geometry. */
  let smoothedOffsets: Float32Array | null = null;
  let waveIntensity = INTRO_WAVE_INTENSITY;
  /**
   * 0 = drift seeded by vertex index (particles move in index order, which
   * reads as a wave travelling along the tube), 1 = drift seeded by world
   * position (neighbours move together, which reads as volume). The intro
   * cross-fades from the first to the second.
   */
  let spatialBlend = 0;
  let introComplete = false;
  /** Allocated once and left at zero; stands in for the cursor offsets on
   *  touch devices, where `applyVertex` ignores them anyway. */
  let zeroOffsets: Float32Array | null = null;

  function updateMouseOffsets(): void {
    const original = tube.getOriginalPositions();
    const matrixWorld = tube.getMatrixWorld();
    if (
      !original ||
      !matrixWorld ||
      !worldVector ||
      !projectedVector ||
      !targetOffsets ||
      !smoothedOffsets
    ) {
      return;
    }

    // Note: the original divides the backing-store size by the raw device
    // pixel ratio even though the renderer clamps its pixel ratio to 2. On
    // >2x displays this makes the hit radius smaller than 125 CSS px.
    const width = canvas
      ? canvas.width / window.devicePixelRatio
      : window.innerWidth;
    const height = canvas
      ? canvas.height / window.devicePixelRatio
      : window.innerHeight;
    const vertexCount = original.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const index = 3 * i;
      worldVector.set(
        original[index],
        original[index + 1],
        original[index + 2],
      );
      worldVector.applyMatrix4(matrixWorld);
      projectedVector.copy(worldVector).project(camera);

      const screenX = (0.5 * projectedVector.x + 0.5) * width;
      const screenY = (0.5 * -projectedVector.y + 0.5) * height;
      const dx = screenX - mouse.x;
      const dy = screenY - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MOUSE_RADIUS) {
        const falloff = 1 - distance / MOUSE_RADIUS;
        const angle = Math.atan2(dy, dx);
        targetOffsets[index] = -Math.cos(angle) * falloff * MOUSE_STRENGTH;
        targetOffsets[index + 1] = -Math.sin(angle) * falloff * MOUSE_STRENGTH;
        targetOffsets[index + 2] = MOUSE_STRENGTH * falloff * MOUSE_Z_FACTOR;
      } else {
        targetOffsets[index] = 0;
        targetOffsets[index + 1] = 0;
        targetOffsets[index + 2] = 0;
      }

      smoothedOffsets[index] +=
        MOUSE_SMOOTHING * (targetOffsets[index] - smoothedOffsets[index]);
      smoothedOffsets[index + 1] +=
        MOUSE_SMOOTHING *
        (targetOffsets[index + 1] - smoothedOffsets[index + 1]);
      smoothedOffsets[index + 2] +=
        MOUSE_SMOOTHING *
        (targetOffsets[index + 2] - smoothedOffsets[index + 2]);
    }
  }

  return {
    init() {
      const original = tube.getOriginalPositions();
      if (original && !isTouchDevice) {
        worldVector = new THREE.Vector3();
        projectedVector = new THREE.Vector3();
        targetOffsets = new Float32Array(original.length);
        smoothedOffsets = new Float32Array(original.length);
      }
    },

    startIntroAnimation() {
      return gsap
        .to(
          { waveIntensity: INTRO_WAVE_INTENSITY },
          {
            waveIntensity: isTouchDevice ? 0 : IDLE_WAVE_INTENSITY,
            duration: INTRO_DURATION,
            ease: INTRO_EASE,
            delay: INTRO_DELAY,
            onUpdate(this: gsap.core.Tween) {
              waveIntensity = (
                this.targets()[0] as { waveIntensity: number }
              ).waveIntensity;
            },
          },
        )
        .then(() => {
          introComplete = true;
          if (isTouchDevice) return;
          gsap.to(
            { spatialBlend },
            {
              spatialBlend: 1,
              duration: SPATIAL_BLEND_DURATION,
              ease: SPATIAL_BLEND_EASE,
              onUpdate(this: gsap.core.Tween) {
                spatialBlend = (
                  this.targets()[0] as { spatialBlend: number }
                ).spatialBlend;
              },
            },
          );
        });
    },

    skipToEnd() {
      const settled = isTouchDevice || prefersReducedMotion;
      waveIntensity = settled ? 0 : IDLE_WAVE_INTENSITY;
      spatialBlend = settled ? 0 : 1;
      introComplete = true;
    },

    updateWavePositions(time: number) {
      const geometry = tube.getGeometry();
      const original = tube.getOriginalPositions();
      if (!geometry || !original) return;

      const positions = (
        geometry.attributes.position as THREE.BufferAttribute
      ).array as Float32Array;

      // The cursor field only engages once the intro has settled.
      if (introComplete && !isTouchDevice) {
        updateMouseOffsets();
      }

      let offsets = smoothedOffsets;
      if (!offsets) {
        if (!zeroOffsets || zeroOffsets.length !== positions.length) {
          zeroOffsets = new Float32Array(positions.length);
        }
        offsets = zeroOffsets;
      }

      for (let i = 0; i < positions.length; i += 3) {
        const originX = original[i];
        const originY = original[i + 1];
        const originZ = original[i + 2];
        const indexWave = waveOffset(time, i, i, i);
        const spatialWave = waveOffset(time, originX, originY, originZ);
        applyVertex(
          positions,
          i,
          original,
          {
            x: indexWave.x * (1 - spatialBlend) + spatialWave.x * spatialBlend,
            y: indexWave.y * (1 - spatialBlend) + spatialWave.y * spatialBlend,
            z: indexWave.z * (1 - spatialBlend) + spatialWave.z * spatialBlend,
          },
          waveIntensity,
          offsets,
          isTouchDevice,
        );
      }

      geometry.attributes.position.needsUpdate = true;
    },

    handleMouseMove(event: MouseEvent) {
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
      } else {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
      }
    },

    isIntroComplete() {
      return introComplete;
    },

    destroy() {
      targetOffsets = null;
      smoothedOffsets = null;
      zeroOffsets = null;
      worldVector = null;
      projectedVector = null;
    },
  };
}

export function createHomeHero(canvas: HTMLCanvasElement) {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let tube: TubeController | null = null;
  let interaction: Interaction | null = null;
  let observer: IntersectionObserver | null = null;
  let onMouseMove: ((event: MouseEvent) => void) | null = null;
  let onResize: (() => void) | null = null;

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const state = { time: 0, visible: false, hasRenderedOnce: false };

  function handleResize(): void {
    if (!camera || !renderer || !tube) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    tube.updateTransform();
  }

  function animate(): void {
    requestAnimationFrame(animate);
    if (!state.visible) return;
    if (!scene || !camera || !renderer || !interaction) return;

    // Touch / reduced-motion users get a single settled frame instead of a
    // continuously animating scene.
    if ((isTouchDevice || reducedMotion) && interaction.isIntroComplete()) {
      if (state.hasRenderedOnce) return;
      state.hasRenderedOnce = true;
      interaction.updateWavePositions(state.time);
      renderer.render(scene, camera);
      return;
    }

    state.time += TIME_STEP;
    interaction.updateWavePositions(state.time);
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
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(CLEAR_COLOR, 1);

      scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

      tube = createTube(scene);
      tube.create();

      interaction = createInteraction({
        tube,
        camera,
        isTouchDevice,
        prefersReducedMotion: reducedMotion,
        canvas,
      });
      interaction.init();

      if (!isTouchDevice) {
        const handler = (event: MouseEvent) => {
          interaction?.handleMouseMove(event);
        };
        onMouseMove = handler;
        window.addEventListener("mousemove", handler);
      }

      observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0].isIntersecting;
        },
        { threshold: 0.1 },
      );
      observer.observe(canvas);

      onResize = handleResize;
      window.addEventListener("resize", onResize);

      if (reducedMotion) {
        interaction.skipToEnd();
      } else {
        void interaction.startIntroAnimation();
      }

      animate();
    },

    destroy() {
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
      if (interaction) {
        interaction.destroy();
        interaction = null;
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
    },
  };
}
