/**
 * GLSL lifted verbatim from the original bundle.
 *
 * Minifiers don't touch string contents, so these survived compilation
 * character-for-character -- they are the original source, not a
 * reconstruction. Preserved exactly (including the `#include` fog chunks) so
 * the WebGL output is identical rather than merely similar.
 *
 * The ten shader pairs in the bundle collapse to three distinct programs;
 * scenes differ only in geometry, uniforms and animation.
 *
 * All three draw square points and discard fragments outside a radius-0.5
 * circle, which is what gives the particles their round dot appearance.
 */

/** Round points, fogged, fully opaque. The default across most scenes. */
export const POINTS_FOG_VERT = `
				uniform float size;
				uniform float sizeAttenuation;
				#include <fog_pars_vertex>
				void main() {
					vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
					gl_PointSize = size * (sizeAttenuation / -mvPosition.z);
					gl_Position = projectionMatrix * mvPosition;
					#include <fog_vertex>
				}
			`;

export const POINTS_FOG_FRAG = `
				uniform vec3 color;
				#include <fog_pars_fragment>
				void main() {
					vec2 center = gl_PointCoord - vec2(0.5);
					if (dot(center, center) > 0.25) discard;
					gl_FragColor = vec4(color, 1.0);
					#include <fog_fragment>
				}
			`;

/** Same, but with a uniform alpha so the scene can fade particles. */
export const POINTS_FOG_OPACITY_VERT = POINTS_FOG_VERT;

export const POINTS_FOG_OPACITY_FRAG = `
				uniform vec3 color;
				uniform float opacity;
				#include <fog_pars_fragment>
				void main() {
					vec2 center = gl_PointCoord - vec2(0.5);
					if (dot(center, center) > 0.25) discard;
					gl_FragColor = vec4(color, opacity);
					#include <fog_fragment>
				}
			`;

/** Unfogged variant, used where the scene has no depth falloff. */
export const POINTS_VERT = `
				uniform float size;
				uniform float sizeAttenuation;
				void main() {
					vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
					gl_PointSize = size * (sizeAttenuation / -mvPosition.z);
					gl_Position = projectionMatrix * mvPosition;
				}
			`;

export const POINTS_FRAG = `
				uniform vec3 color;
				void main() {
					vec2 center = gl_PointCoord - vec2(0.5);
					if (dot(center, center) > 0.25) discard;
					gl_FragColor = vec4(color, 1.0);
				}
			`;
