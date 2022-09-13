import { player } from '..';
import { ATTACK_STATE_IDLE, ATTACK_STATE_WINDING } from '../animation';
import { ACCELERATION } from '../constants';
import { dt, gameTime } from '../lib/engine';
import { tempVec } from '../lib/globals';
import { rotateXMat4, rotateZMat4, scaleMat4, translateMat4 } from '../lib/math/mat4';
import { distanceVec3, fromValuesVec3, normalizeVec3, subtractVec3 } from '../lib/math/vec3';
import { GameEntity } from './entity';

/**
 * Zombie
 */
export class Zombie extends GameEntity {
  constructor(x: number, y: number, z: number) {
    super(x, y, z);
    this.damage = 5;
  }

  update(): void {
    if (!this.isStunned()) {
      const playerDist = distanceVec3(this.pos, player.pos);
      // If player is within 32 units xz
      // and player is within 8 units y
      if (playerDist < 32 && Math.abs(this.pos[1] - player.pos[1]) < 8) {
        this.aggro = true;
      }
      if (this.aggro) {
        if (playerDist < 6) {
          if (this.attackState === ATTACK_STATE_IDLE) {
            this.setAttackState(ATTACK_STATE_WINDING);
          }
        } else {
          // Walk toward player
          subtractVec3(tempVec, player.pos, this.pos);
          normalizeVec3(tempVec, tempVec);
          this.velocity[0] += tempVec[0] * dt * ACCELERATION * 0.9;
          this.velocity[2] += tempVec[2] * dt * ACCELERATION * 0.9;
          this.accelerating = true;
        }
      }
    }
    super.update();
  }
  /**
   * Renders the zombie.
   * @override
   */
  render(): void {
    let leftArmRotationX = -1;
    let leftArmRotationZ = 1.2;
    let rightArmRotationX = -0.3;
    let rightArmRotationZ = -1.2;
    let leftLegRotationX = 0;
    let rightLegRotationX = 0;

    if (this.accelerating) {
      // Running = arms back
      const r = ((gameTime % 0.7) / 0.7) * 2 * Math.PI;
      const speed = Math.min(Math.hypot(this.velocity[0], this.velocity[2]), 20);
      const rotation = speed * Math.sin(r);
      rightArmRotationX = -1 + 0.05 * rotation;
      leftArmRotationX = -1 - 0.05 * rotation;
      rightLegRotationX = -0.07 * rotation;
      leftLegRotationX = 0.07 * rotation;
      leftArmRotationZ = 1.2;
      rightArmRotationZ = -1.2;
    }

    const color = this.getFlashingColor(0xffe0e0e0);

    // Draw face
    {
      const m = this.createSphere(color);
      translateMat4(m, m, fromValuesVec3(0, 7.2, 0));
      scaleMat4(m, m, fromValuesVec3(0.8, 1.0, 0.8));
    }

    // Draw stomach
    {
      const m = this.createCube(color);
      translateMat4(m, m, fromValuesVec3(0, 4.8, 0));
      scaleMat4(m, m, fromValuesVec3(1.0, 1.2, 0.4));
    }

    // Draw left arm
    {
      const m = this.createCube(color);
      translateMat4(m, m, fromValuesVec3(-0.88, 6.0, 0));
      rotateXMat4(m, m, leftArmRotationX);
      rotateZMat4(m, m, leftArmRotationZ);
      translateMat4(m, m, fromValuesVec3(-1.6, 0, 0));
      scaleMat4(m, m, fromValuesVec3(1.2, 0.28, 0.28));
    }

    // Draw right arm
    {
      const m = this.createCube(color);
      translateMat4(m, m, fromValuesVec3(0.88, 6.0, 0));
      rotateXMat4(m, m, rightArmRotationX);
      rotateZMat4(m, m, rightArmRotationZ);
      translateMat4(m, m, fromValuesVec3(1.6, 0, 0));
      scaleMat4(m, m, fromValuesVec3(1.2, 0.28, 0.28));
    }

    // Draw left leg
    {
      const m = this.createCube(color);
      translateMat4(m, m, fromValuesVec3(0.0, 3.6, 0.0));
      rotateXMat4(m, m, leftLegRotationX);
      translateMat4(m, m, fromValuesVec3(-0.6, -2.0, 0.0));
      scaleMat4(m, m, fromValuesVec3(0.32, 1.8, 0.32));
    }

    // Draw right leg
    {
      const m = this.createCube(color);
      translateMat4(m, m, fromValuesVec3(0, 3.6, 0.0));
      rotateXMat4(m, m, rightLegRotationX);
      translateMat4(m, m, fromValuesVec3(0.6, -2.0, 0.0));
      scaleMat4(m, m, fromValuesVec3(0.32, 1.8, 0.32));
    }
  }
}
