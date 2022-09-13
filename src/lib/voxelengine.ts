import { createHsvColor } from './colors';
import { addQuad } from './geometry';
import { createVec3, fromValuesVec3, Vec3 } from './math/vec3';
import { mod, randomBetween, signum } from './utils';

/** Size of the world in voxels on the x-axis. */
export const VOXELS_PER_WORLD_X = 512;

/** Size of the world in voxels on the y-axis. */
export const VOXELS_PER_WORLD_Y = 128;

/** Size of the world in voxels on the z-axis. */
export const VOXELS_PER_WORLD_Z = 512;

/**
 * Empty tile.
 */
export const TILE_EMPTY = 0;
export const TILE_DARK_GRASS = 3;
export const TILE_STONE = 9;
export const TILE_DARK_STONE = 10;

const voxelData = new Uint8Array(VOXELS_PER_WORLD_X * VOXELS_PER_WORLD_Y * VOXELS_PER_WORLD_Z);

/**
 * Returns a color for the given tile type.
 * @param tile The tyle type.
 * @return The tile color.
 */
export function getTileColor(tile: number): number {
  switch (tile) {
    case TILE_DARK_GRASS:
      return createHsvColor(116 / 360.0, randomBetween(0.55, 0.6), randomBetween(0.45, 0.5));
    case TILE_STONE:
      return createHsvColor(0, 0, randomBetween(0.5, 0.6));
    case TILE_DARK_STONE:
      return createHsvColor(0, 0, randomBetween(0.2, 0.22));
  }
  return 0;
}

/**
 * Returns true if the specified cube is out of range of the world.
 * @param x
 * @param y
 * @param z
 * @return
 */
export function isOutOfRange(x: number, y: number, z: number): boolean {
  return x < 0 || x >= VOXELS_PER_WORLD_X || y < 0 || y >= VOXELS_PER_WORLD_X || z < 0 || z >= VOXELS_PER_WORLD_X;
}

/**
 * Returns the array index for the tile.
 * @param x
 * @param y
 * @param z
 * @return
 */
export function getVoxelIndex(x: number, y: number, z: number): number {
  const x2 = x | 0;
  const y2 = y | 0;
  const z2 = z | 0;
  return z2 * VOXELS_PER_WORLD_X * VOXELS_PER_WORLD_Y + y2 * VOXELS_PER_WORLD_X + x2;
}

/**
 * Returns the tile type for the tile.
 * @param x
 * @param y
 * @param z
 * @return
 */
export function getVoxel(x: number, y: number, z: number): number {
  if (isOutOfRange(x, y, z)) {
    return TILE_EMPTY;
  }
  return voxelData[getVoxelIndex(x, y, z)];
}

/**
 * Sets the tile type for the tile.
 * @param x
 * @param y
 * @param z
 * @param v The tile type.
 */
export function setVoxel(x: number, y: number, z: number, v: number): void {
  if (isOutOfRange(x, y, z)) {
    return;
  }
  voxelData[getVoxelIndex(x, y, z)] = v;
}

/**
 * Returns if the tiles is empty or out of range.
 * @param x
 * @param y
 * @param z
 * @return
 */
export function isVoxelEmpty(x: number, y: number, z: number): boolean {
  return getVoxel(x, y, z) === TILE_EMPTY;
}

/**
 * Builds the WebGL BufferSet based on the tile data.
 */
export function buildVoxelGeometry(): Float32Array {
  const geometryData: number[] = [];
  let i = 0;
  for (let z = 0; z < VOXELS_PER_WORLD_Z; z++) {
    for (let y = 0; y < VOXELS_PER_WORLD_Y; y++) {
      for (let x = 0; x < VOXELS_PER_WORLD_X; x++) {
        const t = voxelData[i++];
        if (t === TILE_EMPTY) {
          continue;
        }

        // const color = getTileColor(t);

        const x1 = x;
        const y1 = y;
        const z1 = z;

        const x2 = x1 + 1;
        const y2 = y1 + 1;
        const z2 = z1 + 1;

        const p1 = fromValuesVec3(x1, y2, z2);
        const p2 = fromValuesVec3(x2, y2, z2);
        const p3 = fromValuesVec3(x2, y2, z1);
        const p4 = fromValuesVec3(x1, y2, z1);
        const p5 = fromValuesVec3(x1, y1, z2);
        const p6 = fromValuesVec3(x2, y1, z2);
        const p7 = fromValuesVec3(x2, y1, z1);
        const p8 = fromValuesVec3(x1, y1, z1);

        if (isVoxelEmpty(x1, y2, z1)) {
          addQuad(geometryData, p1, p2, p3, p4); // top
        }

        if (isVoxelEmpty(x1, y1 - 1, z1)) {
          addQuad(geometryData, p8, p7, p6, p5); // bottom
        }

        if (isVoxelEmpty(x1, y1, z2)) {
          addQuad(geometryData, p2, p1, p5, p6); // north
        }

        if (isVoxelEmpty(x1, y1, z1 - 1)) {
          addQuad(geometryData, p4, p3, p7, p8); // south
        }

        if (isVoxelEmpty(x1 - 1, y1, z1)) {
          addQuad(geometryData, p1, p4, p8, p5); // west
        }

        if (isVoxelEmpty(x2, y1, z1)) {
          addQuad(geometryData, p3, p2, p6, p7); // east
        }
      }
    }
  }

  return new Float32Array(geometryData);
}

/**
 * Raycasts from origin to direction.
 *
 * Source:
 * https://gamedev.stackexchange.com/a/49423
 *
 * Call the callback with (x,y,z,value,face) of all blocks along the line
 * segment from point 'origin' in vector direction 'direction' of length
 * 'radius'. 'radius' may be infinite.
 *
 * 'face' is the normal vector of the face of that block that was entered.
 * It should not be used after the callback returns.
 *
 * If the callback returns a true value, the traversal will be stopped.
 *
 * @param origin
 * @param direction
 * @param radius
 * @return Undefined if no collision; the distance if collision.
 */
export function raycast(origin: Vec3, direction: Vec3, radius: number): number | undefined {
  // From "A Fast Voxel Traversal Algorithm for Ray Tracing"
  // by John Amanatides and Andrew Woo, 1987
  // <http://www.cse.yorku.ca/~amana/research/grid.pdf>
  // <http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.42.3443>
  // Extensions to the described algorithm:
  //   • Imposed a distance limit.
  //   • The face passed through to reach the current cube is provided to
  //     the callback.

  // The foundation of this algorithm is a parameterized representation of
  // the provided ray,
  //                    origin + t * direction,
  // except that t is not actually stored; rather, at any given point in the
  // traversal, we keep track of the *greater* t values which we would have
  // if we took a step sufficient to cross a cube boundary along that axis
  // (i.e. change the integer part of the coordinate) in the variables
  // tMaxX, tMaxY, and tMaxZ.

  // Cube containing origin point.
  let x = Math.floor(origin[0]);
  let y = Math.floor(origin[1]);
  let z = Math.floor(origin[2]);

  // Break out direction vector.
  const dx = direction[0];
  const dy = direction[1];
  const dz = direction[2];

  // Direction to increment x,y,z when stepping.
  const stepX = signum(dx);
  const stepY = signum(dy);
  const stepZ = signum(dz);

  // See description above. The initial values depend on the fractional
  // part of the origin.
  let tMaxX = intbound(origin[0], dx);
  let tMaxY = intbound(origin[1], dy);
  let tMaxZ = intbound(origin[2], dz);

  // The change in t when taking a step (always positive).
  const tDeltaX = stepX / dx;
  const tDeltaY = stepY / dy;
  const tDeltaZ = stepZ / dz;

  // Buffer for reporting faces to the callback.
  const face = createVec3();

  // Avoids an infinite loop.
  if (dx === 0 && dy === 0 && dz === 0) {
    throw new RangeError();
  }

  // Rescale from units of 1 cube-edge to units of 'direction' so we can
  // compare with 't'.
  radius /= Math.sqrt(dx * dx + dy * dy + dz * dz);

  let t = Math.min(tMaxX, tMaxY, tMaxZ);
  let steps = 0;

  // eslint-disable-next-line no-constant-condition
  while (steps < 1000) {
    if (face[0] > 0) {
      // Stepping west
      if (!isVoxelEmpty(x, y, z) || !isVoxelEmpty(x - 1, y, z)) {
        return t;
      }
    } else if (face[0] < 0) {
      // Stepping east
      if (!isVoxelEmpty(x, y, z) || !isVoxelEmpty(x + 1, y, z)) {
        return t;
      }
    }

    if (face[1] > 0) {
      // Stepping down
      if (!isVoxelEmpty(x, y, z) || !isVoxelEmpty(x, y - 1, z)) {
        return t;
      }
    } else if (face[1] < 0) {
      // Stepping up
      if (!isVoxelEmpty(x, y, z) || !isVoxelEmpty(x, y + 1, z)) {
        return t;
      }
    }

    if (face[2] > 0) {
      // Stepping south
      if (!isVoxelEmpty(x, y, z) || !isVoxelEmpty(x, y, z - 1)) {
        return t;
      }
    } else if (face[2] < 0) {
      // Stepping north
      if (!isVoxelEmpty(x, y, z) || !isVoxelEmpty(x, y, z + 1)) {
        return t;
      }
    }

    // tMaxX stores the t-value at which we cross a cube boundary along the
    // X axis, and similarly for Y and Z. Therefore, choosing the least tMax
    // chooses the closest cube boundary. Only the first case of the four
    // has been commented in detail.
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        if (tMaxX > radius) {
          break;
        }
        t = tMaxX;
        // Update which cube we are now in.
        x += stepX;
        // Adjust tMaxX to the next X-oriented boundary crossing.
        tMaxX += tDeltaX;
        // Record the normal vector of the cube face we entered.
        face[0] = -stepX;
        face[1] = 0;
        face[2] = 0;
      } else {
        if (tMaxZ > radius) {
          break;
        }
        t = tMaxZ;
        z += stepZ;
        tMaxZ += tDeltaZ;
        face[0] = 0;
        face[1] = 0;
        face[2] = -stepZ;
      }
    } else {
      if (tMaxY < tMaxZ) {
        if (tMaxY > radius) {
          break;
        }
        t = tMaxY;
        y += stepY;
        tMaxY += tDeltaY;
        face[0] = 0;
        face[1] = -stepY;
        face[2] = 0;
      } else {
        // Identical to the second case, repeated for simplicity in
        // the conditionals.
        if (tMaxZ > radius) {
          break;
        }
        t = tMaxZ;
        z += stepZ;
        tMaxZ += tDeltaZ;
        face[0] = 0;
        face[1] = 0;
        face[2] = -stepZ;
      }
    }
    steps++;
  }
  return undefined;
}

/**
 * Find the smallest positive t such that s+t*ds is an integer.
 * @param s
 * @param ds
 * @return
 */
function intbound(s: number, ds: number): number {
  if (ds < 0) {
    return intbound(-s, -ds);
  } else {
    s = mod(s, 1);
    // problem is now s+t*ds = 1
    return (1 - s) / ds;
  }
}
