import { player } from '..';
import { AttackState, ATTACK_STATE_IDLE } from '../animation';
import { COLOR_FLASHING_RED } from '../colors';
import { DASH_DURATION, FRICTION, GRAVITY, JUMP_POWER } from '../constants';
import { collisionDetection } from '../lib/collision';
import { DYNAMIC_CUBES, DYNAMIC_SPHERES } from '../lib/constants';
import { drawLists, dt, gameTime } from '../lib/engine';
import { tempVec } from '../lib/globals';
import {
  createMat4,
  identityMat4,
  Mat4,
  multiplyMat4,
  rotateXMat4,
  rotateYMat4,
  translateMat4,
} from '../lib/math/mat4';
import { copyVec3, createVec3, distanceVec3, fromValuesVec3, magnitudeVec3, setVec3, Vec3 } from '../lib/math/vec3';
import { normalizeRadians } from '../lib/utils';
import { Platform } from './platform';

/**
 * The GameEntity class represents an entity in the game.
 */
export class GameEntity {
  readonly pos: Vec3;
  readonly velocity: Vec3;
  readonly transformMatrix: Mat4;
  team = 0;
  health = 100;
  maxHealth = 100;
  stamina = 100;
  maxStamina = 100;
  yaw = 0;
  accelerating = false;
  groundedTime = 0;
  groundedPlatform?: Platform;
  dashTime = 0;
  slamTime = 0;
  shootTime = 0;
  waypoints?: Vec3[];
  waypointIndex = 0;
  rendered = true;
  bodyOffsetY = 0;
  bodyRotationX = 0;
  bodyRotationY = 0;
  attackState = ATTACK_STATE_IDLE;
  attackStateStartTime = 0;
  attackStateTime = 0;
  attackStatePercent = 0;
  invincibleTime = 0;
  stunTime = 0;
  stunDuration = 1.0;
  damage = 20;
  aggro = false;
  interruptible = true;
  dashing = false;

  /**
   * Creates a new game entity.
   * @param x
   * @param y
   * @param z
   */
  constructor(x?: number, y?: number, z?: number) {
    this.pos = fromValuesVec3(x || 0, y || 0, z || 0);
    this.velocity = createVec3();
    this.transformMatrix = createMat4();
  }

  /**
   * Returns true if the entity is on the ground.
   * @returns
   */
  isGrounded(): boolean {
    return this.groundedTime === gameTime;
  }

  isInvincible(): boolean {
    return gameTime - this.invincibleTime < 1.0;
  }

  isFlashing(): boolean {
    return this.isInvincible() && ((gameTime * 5) | 0) % 2 === 0;
  }

  isStunned(): boolean {
    return gameTime - this.stunTime < this.stunDuration;
  }

  isDashing(): boolean {
    return gameTime - this.dashTime < DASH_DURATION;
  }

  getFlashingColor(normalColor: number): number {
    return this.isDashing() ? 0xffffffff : this.isFlashing() ? COLOR_FLASHING_RED : normalColor;
  }

  /**
   * Returns true if the entity can jump.
   * @returns
   */
  canShoot(): boolean {
    return gameTime - this.shootTime > 0.5;
  }

  /**
   * Starts an attack state.
   * @param attackState
   */
  setAttackState(attackState: AttackState): void {
    this.attackState = attackState;
    this.attackStateStartTime = gameTime;
  }

  isAttackStateComplete(): boolean {
    return this.attackState !== ATTACK_STATE_IDLE && gameTime - this.attackStateStartTime > this.attackState.duration;
  }

  /**
   * Launches the player.
   */
  jump(): void {
    this.velocity[1] = JUMP_POWER;
    this.groundedTime = 0;
    this.groundedPlatform = undefined;
  }

  angleToward(target: Vec3): number {
    return Math.abs(normalizeRadians(this.yaw - Math.atan2(target[0] - this.pos[0], target[2] - this.pos[2])));
  }

  /**
   * Turns toward the target angle.
   * Assumes that this.yaw and angle are in the range -PI to PI.
   * @param dx The target delta x.
   * @param dz The target delta z.
   */
  turnToward(dx: number, dz: number, turnSpeed = 0.2): void {
    const angle = Math.atan2(dx, dz);
    if (this.accelerating) {
      this.yaw = normalizeRadians(this.yaw + turnSpeed * normalizeRadians(angle - this.yaw));
    }
  }

  /**
   * Updates the entity.
   * By default, does nothing.
   */
  update(): void {
    if (!this.isDashing()) {
      this.velocity[0] *= 1.0 / (1.0 + dt * FRICTION);
      this.velocity[2] *= 1.0 / (1.0 + dt * FRICTION);
    }

    this.pos[0] += dt * this.velocity[0];
    this.pos[2] += dt * this.velocity[2];

    const speed = magnitudeVec3(this.velocity);
    if (speed > 0.1) {
      this.turnToward(this.velocity[0], this.velocity[2]);
    } else {
      setVec3(this.velocity, 0, 0, 0);
    }

    const gravity = GRAVITY;
    this.velocity[1] -= dt * gravity;
    this.pos[1] += dt * this.velocity[1];

    if (this.pos[1] < -30) {
      this.pos[1] = -30;
      this.health = 0;
    }

    collisionDetection(this);

    if (this.isAttackStateComplete()) {
      this.setAttackState(this.attackState.nextState as AttackState);
    }
  }

  /**
   * Renders the entity.
   * By default, does nothing.
   * Static entities can use this default implementation.
   */
  render(): void {
    // Subclasses should override
  }

  /**
   * Returns the distance to the player.
   * @returns Distance to the player.
   */
  getDistanceToPlayer(): number {
    return distanceVec3(player.pos, this.pos);
  }

  /**
   * Updates waypoints.
   * Silently ignores if no waypoints are setup.
   * @returns The current waypoint if available.
   */
  updateWaypoints(): Vec3 | undefined {
    if (!this.waypoints) {
      return undefined;
    }
    const waypoint = this.waypoints[this.waypointIndex];
    if (distanceVec3(this.pos, waypoint) < 0.1) {
      this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
    }
    return waypoint;
  }

  /**
   * Sets up the default transform matrix.
   */
  setupTransformMatrix(): void {
    copyVec3(tempVec, this.pos);
    tempVec[1] += this.bodyOffsetY;
    identityMat4(this.transformMatrix);
    translateMat4(this.transformMatrix, this.transformMatrix, tempVec);
    rotateYMat4(this.transformMatrix, this.transformMatrix, this.yaw + this.bodyRotationY);
    rotateXMat4(this.transformMatrix, this.transformMatrix, this.bodyRotationX);
  }

  /**
   * Creates a new sphere transformed to instance space.
   * @param color
   * @returns
   */
  createSphere(color: number): Mat4 {
    const m = drawLists[DYNAMIC_SPHERES].addInstance(color);
    multiplyMat4(m, m, this.transformMatrix);
    return m;
  }

  /**
   * Creates a new cube transformed to instance space.
   * @param color
   * @returns
   */
  createCube(color: number): Mat4 {
    const m = drawLists[DYNAMIC_CUBES].addInstance(color);
    multiplyMat4(m, m, this.transformMatrix);
    return m;
  }
}
