/**
 * Normalizes a radians value to the range -pi to +pi.
 * @param {number} radians
 * @return {number}
 */
export function normalizeRadians(radians: number): number {
  while (radians > Math.PI) {
    radians -= 2 * Math.PI;
  }
  while (radians < -Math.PI) {
    radians += 2 * Math.PI;
  }
  return radians;
}

/**
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export function randomBetween(min: number, max: number): number {
  return min + (max - min) * Math.random();
}

/**
 * Returns the sign of the number
 * @param {number} x
 * @return {number}
 */
export function signum(x: number): number {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

/**
 * Safe mod, works with negative numbers.
 * @param {number} value
 * @param {number} modulus
 * @return {number}
 */
export function mod(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
