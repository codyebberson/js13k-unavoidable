import { Vec3 } from './math/vec3';

/**
 * Creates a little-endian 32-bit color from red, green, and blue components.
 * @param {number} r Red (0-255).
 * @param {number} g Green (0-255).
 * @param {number} b Blue (0-255).
 * @return {number} A 32-bit little-endian color.
 */
export function createColor(r: number, g: number, b: number): number {
  return 0xff000000 + (b << 16) + (g << 8) + r;
}

/**
 * Converts a color from HSV format to RGB format.
 *
 * Based on: https://stackoverflow.com/a/17243070/2051724
 *
 * @param {number} h Hue.
 * @param {number} s Saturation.
 * @param {number} v Value.
 * @return {number} A 32-bit little-endian color.
 */
export function createHsvColor(h: number, s: number, v: number): number {
  // let r, g, b, i, f, p, q, t;
  const i = (h * 6) | 0;
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  // return createColor(
  //   /** @type {number} */ (r * 255) | 0,
  //   /** @type {number} */ (g * 255) | 0,
  //   /** @type {number} */ (b * 255) | 0
  // );
  return createColor(((r as number) * 255) | 0, ((g as number) * 255) | 0, ((b as number) * 255) | 0);
}

/**
 * Blends two RGB colors.
 * @param {number} r1
 * @param {number} g1
 * @param {number} b1
 * @param {number} r2
 * @param {number} g2
 * @param {number} b2
 * @param {number} f
 * @return {number} A 32-bit little-endian color.
 */
export function blendColors(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, f: number): number {
  const f2 = 1.0 - f;
  return createColor((r1 * f2 + r2 * f) | 0, (g1 * f2 + g2 * f) | 0, (b1 * f2 + b2 * f) | 0);
}

/**
 * Blends two RGB colors.
 * @param {!vec3} c1
 * @param {!vec3} c2
 * @param {number} f
 * @return {number} A 32-bit little-endian color.
 */
export function blendColors2(c1: Vec3, c2: Vec3, f: number): number {
  const f2 = 1.0 - f;
  return createColor((c1[0] * f2 + c2[0] * f) | 0, (c1[1] * f2 + c2[1] * f) | 0, (c1[2] * f2 + c2[2] * f) | 0);
}
