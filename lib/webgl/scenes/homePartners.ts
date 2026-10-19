/**
 * HOME PARTNERS.
 *
 * A 30x30 plane of points tilted almost flat and displaced by a 3-octave
 * sine/cosine field, giving a slow rolling dune that recedes into fog. Both the
 * wave amplitude and its frequency oscillate on their own (slower) clocks, so
 * the surface never visibly repeats. Port of `pa()` and `ca()`/`la()` from the
 * original bundle.
 *
 * Uses the fogged, fully-opaque shader pair.
 */

import * as THREE from "three";
import { POINTS_FOG_FRAG, POINTS_FOG_VERT } from "@/lib/webgl/shaders";

const CAMERA_POSITION = { x: 0, y: 2, z: 21 };
const CAMERA_FOV = 75;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

const PLANE = {
  width: 30,
  height: 30,
  widthSegments: 60,
  heightSegments: 60,
  position: { x: 0, y: 4, z: -5.6 },
  rotation: { x: -74, y: 0, z: 0 },
  mobilePosition: { x: 0, y: 3, z: -5 },
  mobileRotation: { x: -78, y: 0, z: 0 },
};

/** Wave amplitude used for the initial (pre-animation) displacement. */
const BASE_AMPLITUDE = 3;
/** Base spatial frequency of the noise field. */
const BASE_FREQUENCY = 0.15;
/** Octaves summed per vertex. Each halves in weight and rises in frequency. */
const OCTAVES = 3;

const ANIMATE_WAVES = true;
/** Speed and depth of the frequency oscillation. */
const FREQUENCY_OSCILLATION_SPEED = 0.35;
const FREQUENCY_OSCILLATION_AMOUNT = 0.35;
/** Speed of the amplitude oscillation, which swings between MIN and MAX. */
const AMPLITUDE_OSCILLATION_SPEED = 0.6;
const AMPLITUDE_MIN = 3;
const AMPLITUDE_MAX = 4;

/** 0xd1d1d1 */
const PARTICLE_COLOR = 13750737;
const PARTICLE_SIZE = 0.25;
const SIZE_ATTENUATION = 170;

const FOG_NEAR = 10;
const FOG_FAR = 100;
/** 0x111111 -- same as the clear colour, so the far edge dissolves. */
const FOG_COLOR = 1118481;
const CLEAR_COLOR = 1118481;

const MOBILE_BREAKPOINT = 768;
const MAX_PIXEL_RATIO = 2;
const VISIBILITY_THRESHOLD = 0.1;

export interface HomePartnersScene {
  init(): void;
  destroy(): void;
}

/**
 * Layered sine/cosine noise. Each octave multiplies the frequency by (n+1) and
 * weights it by 1/(n+1); the cross term (0.7 / 0.8 factors, half weight) breaks
 * up the grid alignment so the ridges read as organic rather than checkered.
 */
function waveHeight(
  x: number,
  y: number,
  amplitude: number,
  frequency: number = BASE_FREQUENCY,
  octaves: number = OCTAVES,
): number {
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const f = frequency * (o + 1);
    const weight = 1 / (o + 1);
    total += Math.sin(x * f) * Math.cos(y * f * 0.7) * weight;
    total += Math.cos(x * f * 0.8) * Math.sin(y * f) * weight * 0.5;
  }
  return total * amplitude;
}

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

interface WavePlane {
  create(): void;
  updateTransform(): void;
  animateWaves(time: number): void;
  destroy(): void;
}

function createWavePlane(scene: THREE.Scene): WavePlane {
  let points: THREE.Points<THREE.PlaneGeometry, THREE.ShaderMaterial> | null =
    null;
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  return {
    create() {
      const geometry = new THREE.PlaneGeometry(
        PLANE.width,
        PLANE.height,
        PLANE.widthSegments,
        PLANE.heightSegments,
      );

      const position = geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        position.setZ(
          i,
          waveHeight(
            position.getX(i),
            position.getY(i),
            BASE_AMPLITUDE,
            BASE_FREQUENCY,
            OCTAVES,
          ),
        );
      }
      geometry.computeVertexNormals();
      position.needsUpdate = true;

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

      const pos = isMobile ? PLANE.mobilePosition : PLANE.position;
      const rot = isMobile ? PLANE.mobileRotation : PLANE.rotation;
      points.position.set(pos.x, pos.y, pos.z);
      points.rotation.set(degToRad(rot.x), degToRad(rot.y), degToRad(rot.z));
      scene.add(points);
    },

    updateTransform() {
      if (!points) return;
      // Re-read the breakpoint on resize rather than reusing the value from
      // create(), so rotating a device swaps the tilt.
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      const pos = mobile ? PLANE.mobilePosition : PLANE.position;
      const rot = mobile ? PLANE.mobileRotation : PLANE.rotation;
      points.position.set(pos.x, pos.y, pos.z);
      points.rotation.set(degToRad(rot.x), degToRad(rot.y), degToRad(rot.z));
    },

    animateWaves(time: number) {
      if (!points || !ANIMATE_WAVES) return;

      const position = points.geometry.attributes.position;
      const frequencyWave = Math.sin(time * FREQUENCY_OSCILLATION_SPEED);
      const frequency =
        BASE_FREQUENCY * (1 + frequencyWave * FREQUENCY_OSCILLATION_AMOUNT);
      const amplitudeWave = Math.sin(time * AMPLITUDE_OSCILLATION_SPEED);
      const span = AMPLITUDE_MAX - AMPLITUDE_MIN;
      const amplitude =
        AMPLITUDE_MIN + 0.5 * span + 0.5 * span * amplitudeWave;

      for (let i = 0; i < position.count; i++) {
        position.setZ(
          i,
          waveHeight(
            position.getX(i),
            position.getY(i),
            amplitude,
            frequency,
            OCTAVES,
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

export function createHomePartnersScene(
  canvas: HTMLCanvasElement,
): HomePartnersScene {
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  let plane: WavePlane | null = null;
  let observer: IntersectionObserver | null = null;
  let onResize: (() => void) | null = null;
  let lastWidth = 0;
  let startTime: number | null = null;
  let frame = 0;

  const state = { visible: false };

  function animate() {
    frame = requestAnimationFrame(animate);
    if (!state.visible || !renderer || !scene || !camera) return;

    // Wall clock rather than a frame counter, so the wave speed is independent
    // of frame rate and pauses while the section is off-screen.
    if (startTime === null) startTime = performance.now();
    if (plane) plane.animateWaves(0.001 * (performance.now() - startTime));
    renderer.render(scene, camera);
  }

  return {
    init() {
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);

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
      // updateStyle=false: the canvas is sized by CSS, so the renderer must not
      // write inline width/height back onto it.
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
      );
      renderer.setClearColor(CLEAR_COLOR, 1);

      plane = createWavePlane(scene);
      plane.create();

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
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        if (plane) plane.updateTransform();
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
      if (plane) {
        plane.destroy();
        plane = null;
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
