"use client";

/**
 * WHY FOUNDERS scene (`yu` in the original bundle, call site: `whyFounders`).
 *
 * The same rolling particle "sea" as the insight scene, but pinned: a
 * ScrollTrigger pins the canvas for the height of the section (second argument,
 * `this.$el`) while the copy scrolls over it. The wave plane here has separate
 * mobile placement, so the horizon stays put on narrow screens.
 *
 * The call site only mounts this at >=768px and tears it down below, so the
 * mobile transform mostly matters for a resize that crosses back up.
 *
 * Shader variant: POINTS_FOG_VERT + POINTS_FOG_FRAG (opaque points, fogged).
 */

import * as THREE from "three";
import { ScrollTrigger } from "@/lib/gsap";
import { POINTS_FOG_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const CAMERA_POSITION = { x: 0, y: 2, z: 21 };
const CAMERA_FOV = 75;

const FOG_NEAR = 10;
const FOG_FAR = 100;
/** Fog is the only colour given as a CSS string in the original. */
const FOG_COLOR = "#111111";
const CLEAR_COLOR = 1118481; // 0x111111

const PLANE_CONFIG = {
  width: 30,
  height: 30,
  widthSegments: 60,
  heightSegments: 60,
  position: { x: 0, y: 4, z: -5.6 },
  rotation: { x: -74, y: 0, z: 0 },
  mobilePosition: { x: 0, y: 3, z: -5 },
  mobileRotation: { x: -78, y: 0, z: 0 },
};

const MOBILE_BREAKPOINT = 768;

/** Base wave field: amplitude, spatial frequency, octave count. */
const WAVE_AMPLITUDE = 3;
const WAVE_FREQUENCY = 0.15;
const WAVE_OCTAVES = 3;

const ANIMATE_WAVES = true;
const FREQUENCY_OSCILLATION_SPEED = 0.35;
const FREQUENCY_OSCILLATION_AMOUNT = 0.35;
const AMPLITUDE_OSCILLATION_SPEED = 0.6;
const AMPLITUDE_MIN = 3;
const AMPLITUDE_MAX = 4;

const PARTICLE_COLOR = 13750737; // 0xd1d1d1
/** Larger than the insight scene's 0.2 -- this plane sits further back. */
const PARTICLE_SIZE = 0.25;
const PARTICLE_SIZE_ATTENUATION = 170;

/** See insightScene: 0.7 / 0.8 detune the two terms to avoid a visible grid. */
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
  updateTransform(): void;
  animateWaves(elapsed: number): void;
  destroy(): void;
}

function createWavePlane(scene: THREE.Scene): WavePlane {
  let points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null =
    null;
  // Sampled once at construction, exactly as the original does.
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  return {
    create() {
      const geometry = new THREE.PlaneGeometry(
        PLANE_CONFIG.width,
        PLANE_CONFIG.height,
        PLANE_CONFIG.widthSegments,
        PLANE_CONFIG.heightSegments,
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

      const placement = isMobile
        ? PLANE_CONFIG.mobilePosition
        : PLANE_CONFIG.position;
      const rotation = isMobile
        ? PLANE_CONFIG.mobileRotation
        : PLANE_CONFIG.rotation;

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
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      const placement = mobile
        ? PLANE_CONFIG.mobilePosition
        : PLANE_CONFIG.position;
      const rotation = mobile
        ? PLANE_CONFIG.mobileRotation
        : PLANE_CONFIG.rotation;

      points.position.set(placement.x, placement.y, placement.z);
      points.rotation.set(
        degToRad(rotation.x),
        degToRad(rotation.y),
        degToRad(rotation.z),
      );
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

export function createWhyFoundersScene(
  canvas: HTMLCanvasElement,
  section: Element,
): Scene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let wavePlane: WavePlane | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let pinTrigger: ScrollTrigger | null = null;
  let previousWidth = 0;
  let startTime: number | null = null;
  let frame = 0;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const state = { visible: false, destroyed: false };

  function bindResize(): void {
    previousWidth = window.innerWidth;
    onResize = () => {
      const width = window.innerWidth;
      // Width-only check: ignores mobile URL-bar height changes.
      if (width === previousWidth) return;
      previousWidth = width;
      if (!camera || !renderer) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      if (wavePlane) wavePlane.updateTransform();
    };
    window.addEventListener("resize", onResize);
  }

  function animate(): void {
    if (state.destroyed) return;
    frame = requestAnimationFrame(animate);
    if (!state.visible) return;
    if (!renderer || !scene || !camera) return;

    // Clock starts on first visible frame, so the waves always begin at t=0.
    startTime ??= performance.now();
    if (wavePlane) wavePlane.animateWaves(0.001 * (performance.now() - startTime));

    renderer.render(scene, camera);
  }

  return {
    init() {
      state.destroyed = false;
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
      });
      // `false` leaves the canvas CSS size alone; layout owns the box.
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(CLEAR_COLOR, 1);

      scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

      wavePlane = createWavePlane(scene);
      wavePlane.create();

      if (!reducedMotion) {
        // Pins the canvas itself; pinSpacing false because the section already
        // reserves the scroll distance.
        pinTrigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          pin: canvas,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });
      }

      observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0].isIntersecting;
        },
        { threshold: 0.1 },
      );
      observer.observe(canvas);

      bindResize();
      animate();
    },

    destroy() {
      state.destroyed = true;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      if (onResize) {
        window.removeEventListener("resize", onResize);
        onResize = null;
      }
      if (pinTrigger) {
        pinTrigger.kill();
        pinTrigger = null;
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
