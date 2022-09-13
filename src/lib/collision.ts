import { GameEntity } from '../entities/entity';
import { dt } from './engine';
import { tempVec } from './globals';
import { createVec3, fromValuesVec3, subtractVec3, Vec3 } from './math/vec3';
import { signum } from './utils';
import { getVoxel, TILE_EMPTY } from './voxelengine';

/**
 * Axes priority array when the x-axis is major.
 * @const {!vec3}
 */
const X_AXIS_MAJOR = fromValuesVec3(0, 1, 2);

/**
 * Axes priority array when the x-axis is major.
 * @const {!vec3}
 */
const Y_AXIS_MAJOR = fromValuesVec3(1, 0, 2);

/**
 * Axes priority array when the x-axis is major.
 * @const {!vec3}
 */
const Z_AXIS_MAJOR = fromValuesVec3(2, 0, 1);

/**
 * Performs collision detection between the entity and the world.
 * @param {!GameEntity} entity The game entity.
 */
export function collisionDetection(entity: GameEntity): void {
  const adx = Math.abs(entity.velocity[0]);
  const ady = Math.abs(entity.velocity[1]);
  const adz = Math.abs(entity.velocity[2]);

  if (adx > adz) {
    if (adx > ady) {
      collisionDetectionX(entity);
      collisionDetectionY(entity);
      collisionDetectionZ(entity);
    } else {
      collisionDetectionY(entity);
      collisionDetectionX(entity);
      collisionDetectionZ(entity);
    }
  } else {
    if (adz > ady) {
      collisionDetectionZ(entity);
      collisionDetectionY(entity);
      collisionDetectionX(entity);
    } else {
      collisionDetectionY(entity);
      collisionDetectionZ(entity);
      collisionDetectionX(entity);
    }
  }
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionX(entity: GameEntity): void {
  if (entity.velocity[0] < 0) {
    collisionDetectionWest(entity);
  } else {
    collisionDetectionEast(entity);
  }
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionY(entity: GameEntity): void {
  if (entity.velocity[1] < 0) {
    collisionDetectionDown(entity);
  } else {
    collisionDetectionUp(entity);
  }
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionZ(entity: GameEntity): void {
  if (entity.velocity[2] > 0) {
    collisionDetectionNorth(entity);
  } else {
    collisionDetectionSouth(entity);
  }
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionDown(entity: GameEntity): void {
  collisionDetectionImpl(
    entity,
    Y_AXIS_MAJOR,
    fromValuesVec3(-0.8, 1 - dt * entity.velocity[1], -0.8),
    fromValuesVec3(0.8, 0, 0.8),
    1
  );
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionUp(entity: GameEntity): void {
  collisionDetectionImpl(entity, Y_AXIS_MAJOR, fromValuesVec3(-0.8, 0, -0.8), fromValuesVec3(0.8, 3, 0.8), 1);
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionWest(entity: GameEntity): void {
  collisionDetectionImpl(entity, X_AXIS_MAJOR, fromValuesVec3(-3, 3, -2), fromValuesVec3(-3, 5, 2), 4);
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionEast(entity: GameEntity): void {
  collisionDetectionImpl(entity, X_AXIS_MAJOR, fromValuesVec3(3, 3, -2), fromValuesVec3(3, 5, 2), -3);
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionNorth(entity: GameEntity): void {
  collisionDetectionImpl(entity, Z_AXIS_MAJOR, fromValuesVec3(-2, 3, 3), fromValuesVec3(2, 5, 3), -3);
}

/**
 * @param {!GameEntity} entity
 */
function collisionDetectionSouth(entity: GameEntity): void {
  collisionDetectionImpl(entity, Z_AXIS_MAJOR, fromValuesVec3(-2, 3, -3), fromValuesVec3(2, 5, -3), 4);
}

/**
 * Checks for collisions between the entity and the voxel world.
 *
 * Tile based collision detection requires checking in correct axis order.
 *
 * axes = length 3 array, indices of axis in priority
 *  for example, if doing x-major:  [0, 1, 2]
 *  for example, if doing y-major:  [1, 0, 2]
 *  for example, if doing z-major:  [2, 0, 1]
 *
 * @param {!GameEntity} entity
 * @param {!vec3} axes Priority list of axes (see above).
 * @param {!vec3} starts Relative offsets from entity position.
 * @param {!vec3} ends Relative offsets from entity position.
 * @param {number} pushback On collision, how much to pushback on the primary axis.
 */
function collisionDetectionImpl(entity: GameEntity, axes: Vec3, starts: Vec3, ends: Vec3, pushback: number): void {
  starts[0] = (entity.pos[0] + starts[0]) | 0;
  starts[1] = (entity.pos[1] + starts[1]) | 0;
  starts[2] = (entity.pos[2] + starts[2]) | 0;

  ends[0] = (entity.pos[0] + ends[0]) | 0;
  ends[1] = (entity.pos[1] + ends[1]) | 0;
  ends[2] = (entity.pos[2] + ends[2]) | 0;

  const deltas = tempVec;
  subtractVec3(deltas, ends, starts);
  deltas[0] = signum(deltas[0]);
  deltas[1] = signum(deltas[1]);
  deltas[2] = signum(deltas[2]);

  const curr = createVec3();
  curr[axes[0]] = starts[axes[0]];

  // eslint-disable-next-line no-constant-condition
  while (1) {
    curr[axes[1]] = starts[axes[1]];

    // eslint-disable-next-line no-constant-condition
    while (1) {
      curr[axes[2]] = starts[axes[2]];

      // eslint-disable-next-line no-constant-condition
      while (1) {
        const tile = getVoxel(curr[0], curr[1], curr[2]);
        if (tile !== TILE_EMPTY) {
          entity.pos[axes[0]] = curr[axes[0]] + pushback;
          entity.velocity[axes[0]] = 0;
          // if (axes[0] === 1) {
          //   entity.jumpCount = 0;
          // }
          // if (entity.entityType === ENTITY_TYPE_PROJECTILE) {
          //   entity.alive = false;
          // }
          return;
        }
        if (curr[axes[2]] === ends[axes[2]]) {
          break;
        }
        curr[axes[2]] += deltas[axes[2]];
      }
      if (curr[axes[1]] === ends[axes[1]]) {
        break;
      }
      curr[axes[1]] += deltas[axes[1]];
    }
    if (curr[axes[0]] === ends[axes[0]]) {
      break;
    }
    curr[axes[0]] += deltas[axes[0]];
  }
}

/**
 * Line intersect with sphere
 * https://math.stackexchange.com/a/1939462
 *
 * @param {!vec3} center Center of sphere.
 * @param {number} radius Radius of sphere.
 * @param {!vec3} start Start of line segment.
 * @param {!vec3} end End of line segment.
 * @return {number|null}
 */
export function lineIntersectSphere(center: Vec3, radius: number, start: Vec3, end: Vec3): number | undefined {
  const r = radius;

  const qx = start[0] - center[0];
  const qy = start[1] - center[1];
  const qz = start[2] - center[2];

  let ux = end[0] - start[0];
  let uy = end[1] - start[1];
  let uz = end[2] - start[2];
  const max = Math.hypot(ux, uy, uz);
  ux /= max;
  uy /= max;
  uz /= max;

  const a = ux * ux + uy * uy + uz * uz;
  const b = 2 * (ux * qx + uy * qy + uz * qz);
  const c = qx * qx + qy * qy + qz * qz - r * r;
  const d = b * b - 4 * a * c;
  if (d < 0) {
    // Solutions are complex, so no intersections
    return undefined;
  }

  const t1 = (-1 * b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  const t2 = (-1 * b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  if ((t1 >= 0.0 && t1 < max) || (t2 >= 0.0 && t2 < max)) {
    return Math.min(t1, t2);
  } else if (t1 >= 0 && t1 < max) {
    return t1;
  } else if (t2 >= 0 && t2 < max) {
    return t2;
  } else {
    return undefined;
  }
}
