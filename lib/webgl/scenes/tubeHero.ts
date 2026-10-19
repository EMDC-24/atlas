"use client";

/**
 * Tube hero (why-wqf).
 *
 * Despite the name this renders a `TorusGeometry` as `THREE.Points` -- a ring
 * of 102x180 (18,360) dots. It sits at z 14 with the camera at z 15, so the
 * near wall of the torus is essentially in the viewer's face and only a slice
 * of the ring is on screen; that is what makes it read as a tube rather than a
 * donut.
 *
 * The ring rolls continuously on Z (-time, unbounded) while X/Y rock inside a
 * +/-20deg band and the whole thing bobs 0.3 units, all driven by the same
 * sin(time) so the motion stays coherent.
 *
 * This is the only one of the three heroes with no fog: nothing here is far
 * enough from the camera to need depth falloff, so it uses the unfogged
 * shader pair.
 */

import * as THREE from "three";

import { POINTS_FRAG, POINTS_VERT } from "@/lib/webgl/shaders";

const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_Z = 15;

const CLEAR_COLOR = 0x111111;

const TORUS_RADIUS = 3;
const TORUS_TUBE = 1;
const TORUS_RADIAL_SEGMENTS = 102;
const TORUS_TUBULAR_SEGMENTS = 180;

const TORUS_POSITION = { x: 0, y: 3, z: 14 };
/** Degrees. The 90deg yaw turns the ring edge-on to the camera. */
const TORUS_ROTATION = { x: 0, y: 90, z: 0 };

const PARTICLE_COLOR = "#909090";
/** Tiny, because sizeAttenuation divides by view-space depth and the torus is
 *  only ~1 unit from the camera -- the effective point size is size * 170 / z. */
const PARTICLE_SIZE = 0.04;
const SIZE_ATTENUATION = 170;

/** Fixed timestep -- the animation is frame-count driven, not clock driven. */
const TIME_STEP = 0.005;

/** Centre and half-range of the X/Y rocking motion. */
const ROTATION_CENTER_X_RADIANS = 0;
const ROTATION_RANGE_X_RADIANS = degToRad(20);
const ROTATION_CENTER_Y_RADIANS = degToRad(90);
const ROTATION_RANGE_Y_RADIANS = degToRad(20);

/** Vertical bob amplitude, applied on top of TORUS_POSITION.y. */
const POSITION_Y_AMPLITUDE = 0.3;

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

type TorusPoints = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

interface TorusController {
  create(): void;
  setRotation(x: number, y: number, z: number): void;
  setPosition(x: number, y: number, z: number): void;
  destroy(): void;
}

function createTorus(scene: THREE.Scene): TorusController {
  let points: TorusPoints | null = null;

  return {
    create() {
      const geometry = new THREE.TorusGeometry(
        TORUS_RADIUS,
        TORUS_TUBE,
        TORUS_RADIAL_SEGMENTS,
        TORUS_TUBULAR_SEGMENTS,
      );

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(PARTICLE_COLOR) },
          size: { value: PARTICLE_SIZE },
          sizeAttenuation: { value: SIZE_ATTENUATION },
        },
        vertexShader: POINTS_VERT,
        fragmentShader: POINTS_FRAG,
        transparent: false,
      });

      points = new THREE.Points(geometry, material);
      points.position.set(
        TORUS_POSITION.x,
        TORUS_POSITION.y,
        TORUS_POSITION.z,
      );
      points.rotation.set(
        degToRad(TORUS_ROTATION.x),
        degToRad(TORUS_ROTATION.y),
        degToRad(TORUS_ROTATION.z),
      );
      scene.add(points);
    },

    setRotation(x: number, y: number, z: number) {
      points?.rotation.set(x, y, z);
    },

    setPosition(x: number, y: number, z: number) {
      points?.position.set(x, y, z);
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

interface TorusAnimator {
  updateTransform(time: number): void;
}

function createTorusAnimator(torus: TorusController): TorusAnimator {
  return {
    updateTransform(time: number) {
      const wave = Math.sin(time);
      torus.setRotation(
        ROTATION_CENTER_X_RADIANS + ROTATION_RANGE_X_RADIANS * wave,
        ROTATION_CENTER_Y_RADIANS + ROTATION_RANGE_Y_RADIANS * wave,
        -time,
      );
      torus.setPosition(
        TORUS_POSITION.x,
        TORUS_POSITION.y + POSITION_Y_AMPLITUDE * wave,
        TORUS_POSITION.z,
      );
    },
  };
}

export function createTubeHero(canvas: HTMLCanvasElement) {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let torus: TorusController | null = null;
  let animator: TorusAnimator | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let lastWidth = 0;

  const state = { time: 0, visible: false };

  function animate(): void {
    requestAnimationFrame(animate);
    if (!state.visible) return;
    if (!scene || !camera || !renderer || !animator) return;

    state.time += TIME_STEP;
    animator.updateTransform(state.time);
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
      camera.position.z = CAMERA_Z;

      renderer = new THREE.WebGLRenderer({
        canvas,
        powerPreference: "high-performance",
        antialias: false,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(CLEAR_COLOR, 1);

      torus = createTorus(scene);
      torus.create();
      animator = createTorusAnimator(torus);

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
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
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
      if (torus) {
        torus.destroy();
        torus = null;
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
      animator = null;
    },
  };
}
