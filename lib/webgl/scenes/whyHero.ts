"use client";

/**
 * Why-WQF hero.
 *
 * A 100x100 plane subdivided 200x200 (40,401 vertices) drawn as `THREE.Points`,
 * displaced on Z by a 3-octave sine/cosine field so it reads as a rolling
 * terrain of dots. The plane is laid almost flat (-80deg on X) and the camera
 * orbits it on a slow ellipse.
 *
 * Both the wave frequency and amplitude are themselves modulated by sine, at
 * different rates (0.35 vs 0.6), so the surface never visibly repeats.
 *
 * Fog near 10 / far 40 with the camera at z 20 fades the far edge of the plane
 * into the background instead of ending it on a hard line -- hence the fogged
 * shader variant.
 */

import * as THREE from "three";

import { POINTS_FOG_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const CAMERA_FOV = 75;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_POSITION = { x: 0, y: 5, z: 20 };

const CLEAR_COLOR = 0x111111;
const FOG_COLOR = 0x111111;
const FOG_NEAR = 10;
const FOG_FAR = 40;

const PLANE = {
  width: 100,
  height: 100,
  widthSegments: 200,
  heightSegments: 200,
  position: { x: 0, y: 4, z: -5 },
  rotation: { x: -80, y: 0, z: 0 },
  mobilePosition: { x: 0, y: 3, z: -3 },
  mobileRotation: { x: -78, y: 0, z: 0 },
} as const;

/** Baseline wave shape, used for the geometry's initial displacement. */
const WAVE_AMPLITUDE = 3;
const WAVE_FREQUENCY = 0.15;
/** Octaves summed per vertex. Each halves in weight and scales up in frequency. */
const WAVE_OCTAVES = 3;

const WAVE_ANIMATION_ENABLED = true;
/** Rate and depth of the frequency wobble. */
const FREQ_MODULATION_SPEED = 0.35;
const FREQ_MODULATION_AMOUNT = 0.35;
/** Rate of the amplitude sweep between MIN and MAX. */
const AMPLITUDE_MODULATION_SPEED = 0.6;
const AMPLITUDE_MIN = 3;
const AMPLITUDE_MAX = 4;

const CAMERA_ORBIT_ENABLED = true;
const CAMERA_ORBIT_SPEED = 0.2;
/** Radius of the XY orbit; the Z bob is larger and runs at 0.7x the rate, so
 *  the camera traces an open, non-repeating path rather than a circle. */
const CAMERA_ORBIT_RADIUS = 1;
const CAMERA_Z_AMPLITUDE = 3;

const PARTICLE_COLOR = 13750737; // 0xd1d1d1
const PARTICLE_SIZE = 0.25;
/** Divisor for the perspective point-size falloff in the vertex shader. */
const SIZE_ATTENUATION = 170;

const MOBILE_BREAKPOINT = 768;

/**
 * Layered sine/cosine noise. Octave `i` runs at `frequency * (i + 1)` with
 * weight `1 / (i + 1)`; the 0.7 / 0.8 / 0.5 factors decorrelate the two terms
 * so the result looks organic instead of like a grid.
 */
function waveHeight(
  x: number,
  y: number,
  amplitude: number,
  frequency = 0.15,
  octaves = 3,
): number {
  let height = 0;
  for (let i = 0; i < octaves; i++) {
    const f = frequency * (i + 1);
    const weight = 1 / (i + 1);
    height += Math.sin(x * f) * Math.cos(y * f * 0.7) * weight;
    height += Math.cos(x * f * 0.8) * Math.sin(y * f) * weight * 0.5;
  }
  return height * amplitude;
}

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

type WavePoints = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

interface WavePlaneController {
  create(): void;
  updateTransform(): void;
  animateWaves(time: number): void;
  destroy(): void;
}

function createWavePlane(scene: THREE.Scene): WavePlaneController {
  let points: WavePoints | null = null;
  // Sampled once at construction, matching the original: `create()` uses this
  // snapshot, `updateTransform()` re-reads the viewport on resize.
  const isMobileAtCreate = window.innerWidth < MOBILE_BREAKPOINT;

  return {
    create() {
      const geometry = new THREE.PlaneGeometry(
        PLANE.width,
        PLANE.height,
        PLANE.widthSegments,
        PLANE.heightSegments,
      );

      const position = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < position.count; i++) {
        position.setZ(
          i,
          waveHeight(
            position.getX(i),
            position.getY(i),
            WAVE_AMPLITUDE,
            WAVE_FREQUENCY,
            WAVE_OCTAVES,
          ),
        );
      }
      geometry.computeVertexNormals();
      position.needsUpdate = true;

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

      const placement = isMobileAtCreate
        ? PLANE.mobilePosition
        : PLANE.position;
      const rotation = isMobileAtCreate
        ? PLANE.mobileRotation
        : PLANE.rotation;
      points.position.set(placement.x, placement.y, placement.z);
      points.rotation.set(
        degToRad(rotation.x),
        degToRad(rotation.y),
        degToRad(rotation.z),
      );
      scene.add(points);
    },

    updateTransform() {
      if (!points) return;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      const placement = isMobile ? PLANE.mobilePosition : PLANE.position;
      const rotation = isMobile ? PLANE.mobileRotation : PLANE.rotation;
      points.position.set(placement.x, placement.y, placement.z);
      points.rotation.set(
        degToRad(rotation.x),
        degToRad(rotation.y),
        degToRad(rotation.z),
      );
    },

    animateWaves(time: number) {
      if (!points || !WAVE_ANIMATION_ENABLED) return;

      const position = points.geometry.attributes
        .position as THREE.BufferAttribute;

      const frequencyScale =
        1 + Math.sin(time * FREQ_MODULATION_SPEED) * FREQ_MODULATION_AMOUNT;
      const frequency = WAVE_FREQUENCY * frequencyScale;

      const amplitudeRange = AMPLITUDE_MAX - AMPLITUDE_MIN;
      const amplitude =
        AMPLITUDE_MIN +
        0.5 * amplitudeRange +
        0.5 * amplitudeRange * Math.sin(time * AMPLITUDE_MODULATION_SPEED);

      for (let i = 0; i < position.count; i++) {
        position.setZ(
          i,
          waveHeight(
            position.getX(i),
            position.getY(i),
            amplitude,
            frequency,
            WAVE_OCTAVES,
          ),
        );
      }
      position.needsUpdate = true;
    },

    destroy() {
      if (points) {
        points.geometry.dispose();
        points.material.dispose();
        scene.remove(points);
        points = null;
      }
    },
  };
}

interface CameraController {
  animateCamera(time: number): void;
}

function createCameraController(
  camera: THREE.PerspectiveCamera,
  initialPosition: { x: number; y: number; z: number },
): CameraController {
  const baseX = initialPosition.x;
  const baseY = initialPosition.y;
  const baseZ = initialPosition.z;

  return {
    animateCamera(time: number) {
      if (!CAMERA_ORBIT_ENABLED) return;
      const angle = time * CAMERA_ORBIT_SPEED;
      // Negative angle => the orbit runs clockwise.
      camera.position.x = baseX + Math.cos(-angle) * CAMERA_ORBIT_RADIUS;
      camera.position.y = baseY + Math.sin(-angle) * CAMERA_ORBIT_RADIUS;
      camera.position.z = baseZ + Math.sin(0.7 * angle) * CAMERA_Z_AMPLITUDE;
    },
  };
}

export function createWhyHero(canvas: HTMLCanvasElement) {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let wavePlane: WavePlaneController | null = null;
  let cameraController: CameraController | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let lastWidth = 0;
  /** Clock start, captured on the first visible frame so the scene always
   *  begins its motion from t = 0 rather than mid-orbit. */
  let startTime: number | null = null;

  const state = { visible: false };

  function animate(): void {
    requestAnimationFrame(animate);
    if (!state.visible) return;
    if (!scene || !camera || !renderer) return;

    if (startTime === null) startTime = performance.now();
    const time = 0.001 * (performance.now() - startTime);

    cameraController?.animateCamera(time);
    wavePlane?.animateWaves(time);
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

      wavePlane = createWavePlane(scene);
      wavePlane.create();

      cameraController = createCameraController(camera, {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      });

      observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0].isIntersecting;
        },
        { threshold: 0.1 },
      );
      observer.observe(canvas);

      lastWidth = window.innerWidth;
      // Width-gated: mobile browsers fire resize when the URL bar collapses,
      // which would otherwise re-lay-out the scene mid-scroll.
      onResize = () => {
        const width = window.innerWidth;
        if (width === lastWidth) return;
        lastWidth = width;
        if (!camera || !renderer || !wavePlane) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        wavePlane.updateTransform();
      };
      window.addEventListener("resize", onResize);

      animate();
    },

    destroy() {
      if (onResize) {
        window.removeEventListener("resize", onResize);
        onResize = null;
      }
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (wavePlane) {
        wavePlane.destroy();
        wavePlane = null;
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
      cameraController = null;
    },
  };
}
