import { COLOR_WHITE } from '../colors';
import { dt } from '../lib/engine';
import { scaleMat4 } from '../lib/math/mat4';
import { createVec3, fromValuesVec3, scaleAndAddVec3, Vec3 } from '../lib/math/vec3';
import { GameEntity } from './entity';

/**
 * Projectile types.
 */
const ProjectileType = {
  None: 0,
  Player: 1,
  Enemy: 2,
};

/**
 * The Particle class represents a purely visual entity.
 * Particles are used for:
 *   1) Floaties - small specks that rise slowly and fade away.
 *   2) Running dust - dust clouds when entities run around.
 *   3) Explosion particles - flying everywhere.
 */
export class Particle extends GameEntity {
  size: number;
  deathRate: number;
  color: number;
  readonly acceleration: Vec3;
  lightColor?: Vec3;
  projectile: number;

  /**
   * Creates a new particle.
   * @param x
   * @param y
   * @param z
   */
  constructor(x?: number, y?: number, z?: number) {
    super(x, y, z);
    this.size = 0.6;
    this.deathRate = 100;
    this.color = COLOR_WHITE;
    this.acceleration = createVec3();
    this.lightColor = undefined;
    this.projectile = ProjectileType.None;
  }

  /**
   * Updates the particle.
   * @override
   */
  update(): void {
    scaleAndAddVec3(this.velocity, this.velocity, this.acceleration, dt);
    scaleAndAddVec3(this.pos, this.pos, this.velocity, dt);
    this.health -= dt * this.deathRate;
  }

  /**
   * Renders the particle.
   * @override
   */
  render(): void {
    const radius = this.size * (this.health / 100);
    const m = this.createSphere(this.color);
    scaleMat4(m, m, fromValuesVec3(radius, radius, radius));
  }
}
