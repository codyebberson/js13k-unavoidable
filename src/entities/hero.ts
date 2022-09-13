import {
  ATTACK_STATE_EXTENDED,
  ATTACK_STATE_RETURNING,
  ATTACK_STATE_SWINGING,
  ATTACK_STATE_WINDING,
} from '../animation';
import { gameTime } from '../lib/engine';
import { rotateXMat4, rotateYMat4, rotateZMat4, scaleMat4, translateMat4 } from '../lib/math/mat4';
import { fromValuesVec3 } from '../lib/math/vec3';
import { Checkpoint } from './checkpoint';
import { GameEntity } from './entity';

/**
 * Hero
 */
export class Hero extends GameEntity {
  activeCheckpoint?: Checkpoint;

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
    if (this.attackState === ATTACK_STATE_WINDING) {
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

    const skinColor = this.getFlashingColor(0xffb5dcf0);
    const eyeColor = this.getFlashingColor(0xff003040);
    const hairColor = this.getFlashingColor(0xff006080);
    const shirtColor = this.getFlashingColor(0xff2e599b);
    const pantsColor = this.getFlashingColor(0xff764f3a);

    // Draw face
    {
      const m = this.createSphere(skinColor);
      translateMat4(m, m, fromValuesVec3(0, 7.2, 0));
      scaleMat4(m, m, fromValuesVec3(0.8, 1.0, 0.8));
    }

    // Draw left eye
    {
      const m = this.createSphere(eyeColor);
      translateMat4(m, m, fromValuesVec3(-0.32, 7.28, 0.72));
      scaleMat4(m, m, fromValuesVec3(0.08, 0.12, 0.08));
    }

    // Draw right eye
    {
      const m = this.createSphere(eyeColor);
      translateMat4(m, m, fromValuesVec3(0.32, 7.28, 0.72));
      scaleMat4(m, m, fromValuesVec3(0.08, 0.12, 0.08));
    }

    // Draw top hair
    {
      const m = this.createSphere(hairColor);
      translateMat4(m, m, fromValuesVec3(0, 7.84, 0.04));
      rotateXMat4(m, m, -0.25);
      scaleMat4(m, m, fromValuesVec3(0.8, 0.4, 0.88));
    }

    // Draw back hair
    {
      const m = this.createSphere(hairColor);
      translateMat4(m, m, fromValuesVec3(0, 7.2, -0.08));
      scaleMat4(m, m, fromValuesVec3(0.84, 0.92, 0.8));
    }

    // Draw stomach
    {
      const m = this.createCube(shirtColor);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(0, 4.72, 0));
      scaleMat4(m, m, fromValuesVec3(0.96, 1.28, 0.4));
    }

    // Draw left arm
    {
      const m = this.createSphere(shirtColor);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(-0.88, 6.0, 0));
      rotateXMat4(m, m, leftArmRotationX);
      rotateZMat4(m, m, leftArmRotationZ);
      translateMat4(m, m, fromValuesVec3(-1.6, 0, 0));
      scaleMat4(m, m, fromValuesVec3(1.2, 0.4, 0.4));
    }

    // Draw right arm
    {
      const m = this.createSphere(shirtColor);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(0.88, 6.0, 0));
      rotateXMat4(m, m, rightArmRotationX);
      rotateZMat4(m, m, rightArmRotationZ);
      translateMat4(m, m, fromValuesVec3(1.6, 0, 0));
      scaleMat4(m, m, fromValuesVec3(1.2, 0.4, 0.4));
    }

    // Draw left leg
    {
      const m = this.createCube(pantsColor);
      translateMat4(m, m, fromValuesVec3(0.0, 3.6, 0.0));
      rotateXMat4(m, m, leftLegRotationX);
      translateMat4(m, m, fromValuesVec3(-0.6, -2, 0.0));
      scaleMat4(m, m, fromValuesVec3(0.32, 1.8, 0.32));
    }

    // Draw right leg
    {
      const m = this.createCube(pantsColor);
      translateMat4(m, m, fromValuesVec3(0.0, 3.6, 0.0));
      rotateXMat4(m, m, rightLegRotationX);
      translateMat4(m, m, fromValuesVec3(0.6, -2, 0.0));
      scaleMat4(m, m, fromValuesVec3(0.32, 1.8, 0.32));
    }

    let swordMultiplier = 1.0;
    let swordColor = 0xfff8f8f8;
    if (this.attackState === ATTACK_STATE_WINDING) {
      // Pulling back
      swordMultiplier = 2;
    } else if (this.attackState === ATTACK_STATE_SWINGING) {
      // Swinging
      swordMultiplier = 1.5;
      swordColor = 0xffffffff;
    } else if (this.attackState === ATTACK_STATE_EXTENDED) {
      // Fully extended
      swordMultiplier = 1.5;
    } else if (this.attackState === ATTACK_STATE_RETURNING) {
      // Return to rest
      swordMultiplier = 1.5;
    }

    // Sword
    {
      const m = this.createCube(swordColor);
      rotateYMat4(m, m, torsoRotationY * swordMultiplier);
      translateMat4(m, m, fromValuesVec3(0.88, 6, 0));
      rotateXMat4(m, m, rightArmRotationX);
      rotateZMat4(m, m, rightArmRotationZ);
      translateMat4(m, m, fromValuesVec3(2.8, 0, 1.6));
      scaleMat4(m, m, fromValuesVec3(0.04, 0.24, 2.8));
    }
    {
      const m = this.createCube(swordColor);
      rotateYMat4(m, m, torsoRotationY * swordMultiplier);
      translateMat4(m, m, fromValuesVec3(0.88, 6.0, 0));
      rotateXMat4(m, m, rightArmRotationX);
      rotateZMat4(m, m, rightArmRotationZ);
      translateMat4(m, m, fromValuesVec3(2.8, 0, 4.8));
      scaleMat4(m, m, fromValuesVec3(1.0, 1.0, 6.0));
      rotateXMat4(m, m, Math.PI / 4);
      // scaleMat4(m, m, fromValuesVec3(0.08, 0.4, 0.4));
      scaleMat4(m, m, fromValuesVec3(0.04, 0.2, 0.2));
    }

    // Shield
    {
      const m = this.createCube(0xffd06060);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(-0.88, 6.0, 0));
      rotateXMat4(m, m, leftArmRotationX);
      rotateZMat4(m, m, leftArmRotationZ);
      translateMat4(m, m, fromValuesVec3(-3.2, 0, 0));
      scaleMat4(m, m, fromValuesVec3(0.08, 1.6, 2));
    }
    {
      const m = this.createCube(0xffe0e0e0);
      rotateYMat4(m, m, torsoRotationY);
      translateMat4(m, m, fromValuesVec3(-0.88, 6.0, 0));
      rotateXMat4(m, m, leftArmRotationX);
      rotateZMat4(m, m, leftArmRotationZ);
      translateMat4(m, m, fromValuesVec3(-3.2, 0, 0));
      scaleMat4(m, m, fromValuesVec3(0.16, 1.2, 1.6));
    }
  }
}
