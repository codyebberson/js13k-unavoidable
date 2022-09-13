import { createColor } from '../lib/colors';
import { dt, gameTime } from '../lib/engine';
import { scaleMat4 } from '../lib/math/mat4';
import {
  copyVec3,
  createVec3,
  fromValuesVec3,
  rotateYVec3,
  rotateZVec3,
  scaleVec3,
  subtractVec3,
  Vec3,
} from '../lib/math/vec3';
import { GameEntity } from './entity';

const fireballColor = createColor(255, 128, 64);
const prevPos = createVec3();

/**
 * Fireball entities rotate around a certain point.
 * They can be combined to create fire walls.
 */
export class Fireball extends GameEntity {
  readonly point: Vec3;
  readonly center: Vec3;
  readonly speed: number;
  readonly angleOffset: number;
  readonly rotateZ?: boolean;

  constructor(point: Vec3, center: Vec3, speed = 1, angleOffset = 0, rotateZ?: boolean) {
    super(0, 0, 0);
    this.point = point;
    this.center = center;
    this.speed = speed;
    this.angleOffset = angleOffset;
    this.rotateZ = rotateZ;
  }

  update(): void {
    copyVec3(prevPos, this.pos);
    const angle = this.angleOffset + gameTime * this.speed;
    if (this.rotateZ) {
      rotateZVec3(this.pos, this.point, this.center, angle);
    } else {
      rotateYVec3(this.pos, this.point, this.center, angle);
    }
    subtractVec3(this.velocity, this.pos, prevPos);
    scaleVec3(this.velocity, this.velocity, 1.0 / dt);
  }

  render(): void {
    const radius = 1.5;
    const m = this.createSphere(fireballColor);
    scaleMat4(m, m, fromValuesVec3(radius, radius, radius));
  }
}
