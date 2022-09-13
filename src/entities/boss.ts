import { player } from '..';
import {
  ATTACK_STATE_EXTENDED,
  ATTACK_STATE_IDLE,
  ATTACK_STATE_RETURNING,
  ATTACK_STATE_SLOW_WINDING,
  ATTACK_STATE_SWINGING,
  ATTACK_STATE_WINDING,
} from '../animation';
import { ACCELERATION } from '../constants';
import { dt, gameTime } from '../lib/engine';
import { tempVec } from '../lib/globals';
import { rotateXMat4, rotateYMat4, rotateZMat4, scaleMat4, translateMat4 } from '../lib/math/mat4';
import { distanceVec3, fromValuesVec3, normalizeVec3, subtractVec3 } from '../lib/math/vec3';
import { GameEntity } from './entity';

export class Boss extends GameEntity {
  /**
   * Sets up the default transform matrix.
   */
  setupTransformMatrix(): void {
    const r = -((gameTime % 0.7) / 0.7) * 2 * Math.PI;
    const theta = this.accelerating ? r * 2 : r * 1;
    const speed = Math.min(Math.hypot(this.velocity[0], this.velocity[2]), 40);
    this.bodyOffsetY = 0.01 * Math.sin(theta) * Math.max(3, speed);
    this.bodyRotationX = 0.1 + 0.01 * speed;
    this.bodyRotationY = 0.005 * Math.sin(r) * speed;

    this.attackStateTime = gameTime - this.attackStateStartTime;
    this.attackStatePercent = this.attackStateTime / this.attackState.duration;

    if (this.attackState === ATTACK_STATE_WINDING) {
      // Pulling back / winding up
      this.bodyRotationX = -0.1 * this.attackStatePercent;
    } else if (this.attackState === ATTACK_STATE_SWINGING) {
      // Main swing
      this.bodyRotationX = 0.3 * this.attackStatePercent;
    } else if (this.attackState === ATTACK_STATE_EXTENDED) {
      // Fully extended
      this.bodyRotationX = 0.3;
    } else if (this.attackState === ATTACK_STATE_RETURNING) {
      // Returning to rest
      this.bodyRotationX = 0.3 + (this.bodyRotationX - 0.3) * this.attackStatePercent;
    }

    super.setupTransformMatrix();
  }

  update(): void {
    if (!this.isStunned()) {
      // this.turnToward(player.pos[0] - this.pos[0], player.pos[2] - this.pos[2]);
      const playerDist = distanceVec3(this.pos, player.pos);
      // If player is within 32 units xz
      // and player is within 8 units y
      if (playerDist < 32 && Math.abs(this.pos[1] - player.pos[1]) < 8) {
        this.aggro = true;
      }
      if (this.aggro) {
        if (playerDist < 8 && this.angleToward(player.pos) < 1.5) {
          if (this.attackState === ATTACK_STATE_IDLE) {
            this.setAttackState(ATTACK_STATE_SLOW_WINDING);
          }
        } else if (this.attackState === ATTACK_STATE_IDLE) {
          // Walk toward player
          subtractVec3(tempVec, player.pos, this.pos);
          normalizeVec3(tempVec, tempVec);
          this.velocity[0] += tempVec[0] * dt * ACCELERATION * 0.2;
          this.velocity[2] += tempVec[2] * dt * ACCELERATION * 0.2;
          this.accelerating = true;
        }
      }
    }
    super.update();
  }

  /**
   * Renders the player model.
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
      const speed = Math.min(Math.hypot(this.velocity[0], this.velocity[2]), 80);
      const rotation = 0.25 * speed * Math.sin(r);
      rightArmRotationX = -0.4 + 0.05 * rotation;
      leftArmRotationX = -1 - 0.03 * rotation;
      rightLegRotationX = -0.07 * rotation;
      leftLegRotationX = 0.07 * rotation;
      leftArmRotationZ = 1.2;
      rightArmRotationZ = -1.2;
    } else {
      // Idle - small bounce
      const r = ((gameTime % 0.7) / 0.7) * Math.PI;
      rightArmRotationX += 0.1 * Math.sin(r);
      leftArmRotationX += 0.1 * Math.sin(r);
    }

    let torsoRotationY = 0;

    // let bodyRotation = 0;
    if (this.attackState === ATTACK_STATE_SLOW_WINDING) {
      // Pulling back / winding up
      // 0 -> 1.0
      torsoRotationY = this.attackStatePercent;
    } else if (this.attackState === ATTACK_STATE_SWINGING) {
      // Main swing
      // 1.0 -> -1.0
      torsoRotationY = 1 - 2.0 * this.attackStatePercent;
    } else if (this.attackState === ATTACK_STATE_EXTENDED) {
      // Fully extended
      // Consistent -1.0
      torsoRotationY = -1;
    } else if (this.attackState === ATTACK_STATE_RETURNING) {
      // Returning to rest
      // -1.0 -> 0.0
      torsoRotationY = -1 + this.attackStatePercent;
    }

    const skinColor = this.getFlashingColor(0xfff4f4f4);
    const eyeColor = this.getFlashingColor(0xff003040);
    const shirtColor = this.getFlashingColor(0xff404040);

    const scale = 3.0;

    // Draw face
    {
      const m = this.createSphere(skinColor);
      translateMat4(m, m, fromValuesVec3(0, 7.6 * scale, 0));
      scaleMat4(m, m, fromValuesVec3(1.2 * scale, 1.2 * scale, scale));
    }

    // Draw left eye
    {
      const m = this.createSphere(eyeColor);
      translateMat4(m, m, fromValuesVec3(-0.5 * scale, 7.28 * scale, 0.8 * scale));
      scaleMat4(m, m, fromValuesVec3(0.3 * scale, 0.3 * scale, 0.2 * scale));
    }

    // Draw right eye
    {
      const m = this.createSphere(eyeColor);
      translateMat4(m, m, fromValuesVec3(0.5 * scale, 7.28 * scale, 0.8 * scale));
      scaleMat4(m, m, fromValuesVec3(0.3 * scale, 0.3 * scale, 0.2 * scale));
    }

    // Draw stomach
    {
      const m = this.createCube(shirtColor);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(0, 4.72 * scale, 0));
      scaleMat4(m, m, fromValuesVec3(0.96 * scale, 1.28 * scale, 0.4 * scale));
    }

    // Draw left arm
    {
      const m = this.createSphere(shirtColor);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(-0.88 * scale, 6.0 * scale, 0));
      rotateXMat4(m, m, leftArmRotationX);
      rotateZMat4(m, m, leftArmRotationZ);
      translateMat4(m, m, fromValuesVec3(-1.6 * scale, 0, 0));
      scaleMat4(m, m, fromValuesVec3(1.2 * scale, 0.4 * scale, 0.4 * scale));
    }

    // Draw right arm
    {
      const m = this.createSphere(shirtColor);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(0.88 * scale, 6.0 * scale, 0));
      rotateXMat4(m, m, rightArmRotationX);
      rotateZMat4(m, m, rightArmRotationZ);
      translateMat4(m, m, fromValuesVec3(1.6 * scale, 0, 0));
      scaleMat4(m, m, fromValuesVec3(1.2 * scale, 0.4 * scale, 0.4 * scale));
    }

    // Draw left leg
    {
      const m = this.createCube(shirtColor);
      translateMat4(m, m, fromValuesVec3(0.0, 3.6 * scale, 0.0));
      rotateXMat4(m, m, leftLegRotationX);
      translateMat4(m, m, fromValuesVec3(-0.6 * scale, -2 * scale, 0.0));
      scaleMat4(m, m, fromValuesVec3(0.32 * scale, 1.8 * scale, 0.32 * scale));
    }

    // Draw right leg
    {
      const m = this.createCube(shirtColor);
      translateMat4(m, m, fromValuesVec3(0.0, 3.6 * scale, 0.0));
      rotateXMat4(m, m, rightLegRotationX);
      translateMat4(m, m, fromValuesVec3(0.6 * scale, -2 * scale, 0.0));
      scaleMat4(m, m, fromValuesVec3(0.32 * scale, 1.8 * scale, 0.32 * scale));
    }

    let swordMultiplier = 1.0;
    if (this.attackState === ATTACK_STATE_SLOW_WINDING) {
      // Pulling back
      swordMultiplier = 2;
    } else if (this.attackState === ATTACK_STATE_SWINGING) {
      // Swinging
      swordMultiplier = 1.5;
    } else if (this.attackState === ATTACK_STATE_EXTENDED) {
      // Fully extended
      swordMultiplier = 1.5;
    } else if (this.attackState === ATTACK_STATE_RETURNING) {
      // Return to rest
      swordMultiplier = 1.5;
    }

    // Sword
    {
      const m = this.createCube(0xfff8f8f8);
      rotateYMat4(m, m, torsoRotationY * swordMultiplier);
      translateMat4(m, m, fromValuesVec3(0.88 * scale, 6 * scale, 0));
      rotateXMat4(m, m, rightArmRotationX);
      rotateZMat4(m, m, rightArmRotationZ);
      translateMat4(m, m, fromValuesVec3(2.8 * scale, 0, 1.6 * scale));
      scaleMat4(m, m, fromValuesVec3(0.04 * scale, 0.24 * scale, 2.8 * scale));
    }
  }
}
