/**
 * FOCUS INDUSTRIES (home).
 *
 * One torus drawn as a point cloud, turned edge-on to the camera, rocking on a
 * sine wave while spinning around Z. Port of `Gr()` from the original bundle.
 *
 * This is the only scene of the four with no fog, so it uses the unfogged
 * shader pair. The clear colour (0xdadada) is lighter than the particle colour
 * (#A9A9A9), so the dots read dark-on-light -- inverted from the other scenes.
 */

import * as THREE from "three";
import { POINTS_FRAG, POINTS_VERT } from "@/lib/webgl/shaders";

const CAMERA_FOV = 60;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;
const CAMERA_Z = 15;

const TORUS_RADIUS = 3;
const TORUS_TUBE = 1;
const TORUS_RADIAL_SEGMENTS = 102;
const TORUS_TUBULAR_SEGMENTS = 180;

const POSITION_X = 0;
const POSITION_Y = 3;
const POSITION_Z = 14;

const ROTATION_X_DEG = 0;
const ROTATION_Y_DEG = 90;
const ROTATION_Z_DEG = 0;

const PARTICLE_COLOR = "#A9A9A9";
const PARTICLE_SIZE = 0.04;
const SIZE_ATTENUATION = 170;

/** 0xdadada -- the light backdrop this section sits on. */
const CLEAR_COLOR = 14342874;

const TIME_STEP = 0.005;
/** Vertical bob layered on top of the rotation, in world units. */
const BOB_AMPLITUDE = 0.3;

const MAX_PIXEL_RATIO = 2;
const VISIBILITY_THRESHOLD = 0.1;

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Rocking limits, pre-converted to radians. `setRotation` on the torus takes
 * radians directly (no conversion), unlike the morphing scenes.
 */
const ROCK = {
  centerXRadians: 0,
  rangeXRadians: degToRad(20),
  centerYRadians: degToRad(90),
  rangeYRadians: degToRad(20),
};

export interface FocusIndustriesScene {
  init(): void;
  destroy(): void;
}

interface TorusPoints {
  create(): void;
  setRotation(x: number, y: number, z: number): void;
  setPosition(x: number, y: number, z: number): void;
  destroy(): void;
}

function createTorusPoints(scene: THREE.Scene): TorusPoints {
  let points: THREE.Points<THREE.TorusGeometry, THREE.ShaderMaterial> | null =
    null;

  return {
    create() {
      const geometry = new THREE.TorusGeometry(
        TORUS_RADIUS,
        TORUS_TUBE,
        TORUS_RADIAL_SEGMENTS,
        TORUS_TUBULAR_SEGMENTS,
      );

      points = new THREE.Points(
        geometry,
        new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(PARTICLE_COLOR) },
            size: { value: PARTICLE_SIZE },
            sizeAttenuation: { value: SIZE_ATTENUATION },
          },
          vertexShader: POINTS_VERT,
          fragmentShader: POINTS_FRAG,
          transparent: false,
        }),
      );

      points.position.set(POSITION_X, POSITION_Y, POSITION_Z);
      points.rotation.set(
        (ROTATION_X_DEG * Math.PI) / 180,
        (ROTATION_Y_DEG * Math.PI) / 180,
        (ROTATION_Z_DEG * Math.PI) / 180,
      );
      scene.add(points);
    },

    setRotation(x, y, z) {
      if (points) points.rotation.set(x, y, z);
    },

    setPosition(x, y, z) {
      if (points) points.position.set(x, y, z);
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

export function createFocusIndustriesScene(
  canvas: HTMLCanvasElement,
): FocusIndustriesScene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let torus: TorusPoints | null = null;
  let transform: {
    updateTransform(time: number): void;
    setStaticPosition(): void;
  } | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let lastWidth = 0;
  let frame = 0;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const state = { time: 0, visible: false, hasRenderedOnce: false };

  function animate() {
    frame = requestAnimationFrame(animate);
    if (!state.visible || !renderer || !scene || !camera || !transform) return;

    if (reducedMotion) {
      // Reduced motion still needs one frame so the torus isn't a blank canvas.
      if (!state.hasRenderedOnce) {
        state.hasRenderedOnce = true;
        transform.setStaticPosition();
        renderer.render(scene, camera);
      }
      return;
    }

    state.time += TIME_STEP;
    transform.updateTransform(state.time);
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
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
      );
      renderer.setClearColor(CLEAR_COLOR, 1);

      torus = createTorusPoints(scene);
      torus.create();

      const target = torus;
      transform = {
        updateTransform(time: number) {
          const wave = Math.sin(time);
          target.setRotation(
            ROCK.centerXRadians + ROCK.rangeXRadians * wave,
            ROCK.centerYRadians + ROCK.rangeYRadians * wave,
            -time,
          );
          target.setPosition(
            POSITION_X,
            POSITION_Y + BOB_AMPLITUDE * wave,
            POSITION_Z,
          );
        },
        setStaticPosition() {
          target.setRotation(ROCK.centerXRadians, ROCK.centerYRadians, 0);
          target.setPosition(POSITION_X, POSITION_Y, POSITION_Z);
        },
      };

      observer = new IntersectionObserver(
        (entries) => {
          state.visible = entries[0].isIntersecting;
        },
        { threshold: VISIBILITY_THRESHOLD },
      );
      observer.observe(canvas);

      // Width-only comparison: mobile browsers fire resize when the URL bar
      // collapses, and reacting to that causes a visible jump.
      lastWidth = window.innerWidth;
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
      transform = null;
    },
  };
}
