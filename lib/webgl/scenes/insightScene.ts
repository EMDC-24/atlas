"use client";

/**
 * INSIGHT entry scene (`Pl` in the original bundle, call site: `insight`).
 *
 * A single 30x30 plane of particles tilted almost flat (-74deg) and displaced by
 * a layered sine/cosine field, giving a rolling "sea" of dots under the copy.
 * No scroll interaction -- it just animates on a clock while it is on screen.
 *
 * Shader variant: POINTS_FOG_VERT + POINTS_FOG_FRAG (opaque points, fogged).
 */

import * as THREE from "three";
import { POINTS_FOG_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const CAMERA_POSITION = { x: 0, y: 2, z: 21 };
const CAMERA_FOV = 75;

const PLANE_WIDTH = 30;
const PLANE_HEIGHT = 30;
const PLANE_WIDTH_SEGMENTS = 60;
const PLANE_HEIGHT_SEGMENTS = 60;

const PLANE_POSITION = { x: 0, y: 3, z: 6 };
/** Degrees. -74 on x lays the plane down into a near-ground perspective. */
const PLANE_ROTATION = { x: -74, y: 0, z: 0 };

/** Base wave field: amplitude, spatial frequency, and octave count. */
const WAVE_AMPLITUDE = 3;
const WAVE_FREQUENCY = 0.15;
const WAVE_OCTAVES = 3;

const ANIMATE_WAVES = true;
/** Frequency wobble: speed, then depth as a fraction of WAVE_FREQUENCY. */
const FREQUENCY_OSCILLATION_SPEED = 0.35;
const FREQUENCY_OSCILLATION_AMOUNT = 0.35;
/** Amplitude wobble: speed, then the range it sweeps between. */
const AMPLITUDE_OSCILLATION_SPEED = 0.6;
const AMPLITUDE_MIN = 3;
const AMPLITUDE_MAX = 4;

const PARTICLE_COLOR = 13750737; // 0xd1d1d1
const PARTICLE_SIZE = 0.2;
const PARTICLE_SIZE_ATTENUATION = 170;

const FOG_NEAR = 10;
const FOG_FAR = 100;
const FOG_COLOR = 1118481; // 0x111111

/**
 * Sums `octaves` layers of sin/cos at increasing frequency and decreasing
 * weight. The 0.7 / 0.8 factors detune the two terms so the pattern never
 * repeats into a visible grid.
 */
function waveHeight(
  x: number,
  y: number,
  amplitude: number,
  frequency: number = 0.15,
  octaves: number = 3,
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

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

interface WavePlane {
  create(): void;
  animateWaves(elapsed: number): void;
  destroy(): void;
}

function createWavePlane(scene: THREE.Scene): WavePlane {
  let points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null =
    null;

  return {
    create() {
      const geometry = new THREE.PlaneGeometry(
        PLANE_WIDTH,
        PLANE_HEIGHT,
        PLANE_WIDTH_SEGMENTS,
        PLANE_HEIGHT_SEGMENTS,
      );

      const position = geometry.attributes.position;
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
            sizeAttenuation: { value: PARTICLE_SIZE_ATTENUATION },
          },
        ]),
        vertexShader: POINTS_FOG_VERT,
        fragmentShader: POINTS_FOG_FRAG,
        fog: true,
        transparent: false,
      });

      points = new THREE.Points(geometry, material);
      points.position.set(PLANE_POSITION.x, PLANE_POSITION.y, PLANE_POSITION.z);
      points.rotation.set(
        degToRad(PLANE_ROTATION.x),
        degToRad(PLANE_ROTATION.y),
        degToRad(PLANE_ROTATION.z),
      );
      scene.add(points);
    },

    animateWaves(elapsed: number) {
      if (!points || !ANIMATE_WAVES) return;

      const position = points.geometry.attributes.position;
      const frequency =
        WAVE_FREQUENCY *
        (1 +
          Math.sin(elapsed * FREQUENCY_OSCILLATION_SPEED) *
            FREQUENCY_OSCILLATION_AMOUNT);
      const swing = Math.sin(elapsed * AMPLITUDE_OSCILLATION_SPEED);
      const range = AMPLITUDE_MAX - AMPLITUDE_MIN;
      const amplitude = AMPLITUDE_MIN + 0.5 * range + 0.5 * range * swing;

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

export interface Scene {
  init(): void;
  destroy(): void;
}

export function createInsightScene(canvas: HTMLCanvasElement): Scene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let wavePlane: WavePlane | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let previousWidth = 0;
  let startTime: number | null = null;
  let frame = 0;

  const state = { visible: false };

  function animate(): void {
    frame = requestAnimationFrame(animate);
    if (!state.visible) return;
    if (!renderer || !scene || !camera) return;

    // Clock starts on first visible frame, so the waves always begin at t=0.
    if (startTime === null) startTime = performance.now();
    if (wavePlane) wavePlane.animateWaves(0.001 * (performance.now() - startTime));

    renderer.render(scene, camera);
  }

  return {
    init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000,
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
        alpha: true,
      });
      // `false` leaves the canvas CSS size alone; layout owns the box.
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0, 0);

      scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

      wavePlane = createWavePlane(scene);
      wavePlane.create();

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
        if (width === previousWidth) return;
        previousWidth = width;
        if (!camera || !renderer) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
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
      startTime = null;
    },
  };
}
