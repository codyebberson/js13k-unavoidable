import { COLOR_SILVER } from '../colors';
import { DYNAMIC_CUBES } from '../lib/constants';
import { drawLists, dt } from '../lib/engine';
import { multiplyMat4, scaleMat4 } from '../lib/math/mat4';
import { fromValuesVec3, normalizeVec3, scaleAndAddVec3, scaleVec3, subtractVec3, Vec3 } from '../lib/math/vec3';
import { GameEntity } from './entity';

/**
 * The Platform class represents something that other entities can stand on.
 * Platforms can be stationary or moving.
 */
export class Platform extends GameEntity {
  color: number;
  scale: Vec3;
  speed = 24;

  /**
   * Creates a new particle.
   * @param x
   * @param y
   * @param z
   */
  constructor(x?: number, y?: number, z?: number) {
    super(x, y, z);
    this.color = COLOR_SILVER;
    this.scale = fromValuesVec3(1, 1, 1);
  }

  /**
   * Updates the platform.
   * @override
   */
  update(): void {
    const waypoint = this.updateWaypoints();
    if (waypoint) {
      subtractVec3(this.velocity, waypoint, this.pos);
      normalizeVec3(this.velocity, this.velocity);
      scaleVec3(this.velocity, this.velocity, this.speed);
      scaleAndAddVec3(this.pos, this.pos, this.velocity, dt);
    }
  }

  /**
   * Renders the platform.
   * @override
   */
  render(): void {
    if (this.waypoints) {
      const m = drawLists[DYNAMIC_CUBES].addInstance(this.color);
      multiplyMat4(m, m, this.transformMatrix);
      scaleMat4(m, m, this.scale);
    }
  }
}
