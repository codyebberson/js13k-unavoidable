import { player } from '..';
import { gameTime } from '../lib/engine';
import { rotateXMat4, rotateZMat4, scaleMat4, translateMat4 } from '../lib/math/mat4';
import { fromValuesVec3 } from '../lib/math/vec3';
import { GameEntity } from './entity';

export class Checkpoint extends GameEntity {
  objective: number;

  constructor(x: number, y: number, z: number, objective: number) {
    super(x, y, z);
    this.objective = objective;
  }

  render(): void {
    const rotation = gameTime * 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 4.0;
      const x = Math.cos(rotation + angle) * radius;
      const z = Math.sin(rotation + angle) * radius;
      const color = player.activeCheckpoint === this ? 0xffff8080 : 0xfff0a0a0;
      const m = this.createCube(color);
      translateMat4(m, m, fromValuesVec3(x, 1, z));
      rotateXMat4(m, m, rotation);
      rotateZMat4(m, m, rotation);
      scaleMat4(m, m, fromValuesVec3(0.4, 0.4, 0.4));
    }

    {
      const m = this.createSphere(0xfff04040);
      scaleMat4(m, m, fromValuesVec3(5, 0.1, 5));
    }
  }
}
