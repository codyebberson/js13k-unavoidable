import { entities, player } from '..';
import { ATTACK_STATE_CHARGING, ATTACK_STATE_IDLE, ATTACK_STATE_SHOOTING } from '../animation';
import { DYNAMIC_SPHERES } from '../lib/constants';
import { drawLists, gameTime } from '../lib/engine';
import { scaleMat4, translateMat4 } from '../lib/math/mat4';
import { copyVec3, createVec3, distanceVec3, fromValuesVec3 } from '../lib/math/vec3';
import { GameEntity } from './entity';
import { Particle } from './particle';
import { ParticleGenerator } from './particlegenerator';

/**
 * Eyeball entities do the following:
 * 1. Move slowly towards the player.
 * 2. Stop and lock on to the player.
 * 3. Charge up a fireball.
 * 4. Fire the fireball.
 * 5. Repeat.
 */
export class Eyeball extends GameEntity {
  lockPosition = createVec3();

  constructor(x: number, y: number, z: number) {
    super(x, y, z);
    this.team = 2;
    this.damage = 50;
    this.health = 200;
  }

  update(): void {
    if (!this.isStunned()) {
      this.accelerating = true; // needed for turnToward
      const playerDist = distanceVec3(this.pos, player.pos);
      // If player is within 32 units xz
      // and player is within 8 units y
      if (playerDist < 64) {
        this.aggro = true;
      }
      if (this.aggro) {
        if (this.attackState === ATTACK_STATE_IDLE) {
          this.turnToward(player.pos[0] - this.pos[0], player.pos[2] - this.pos[2]);
          if (playerDist < 64 && this.angleToward(player.pos) < 0.1) {
            copyVec3(this.lockPosition, player.pos);
            this.setAttackState(ATTACK_STATE_CHARGING);
          }
        }
        if (this.attackState === ATTACK_STATE_CHARGING) {
          this.turnToward(this.lockPosition[0] - this.pos[0], this.lockPosition[2] - this.pos[2], 1);
        }
      }
      if (this.attackState === ATTACK_STATE_CHARGING && this.isAttackStateComplete()) {
        entities.push(
          new ParticleGenerator(
            this.lockPosition[0],
            this.lockPosition[1],
            this.lockPosition[2],
            (gen: ParticleGenerator) => {
              if (Math.random() < 0.5) {
                const angle = Math.random() * 2.0 * Math.PI;
                const radius = 1 + Math.random() * 7;
                const dx = Math.cos(angle) * radius;
                const dz = Math.sin(angle) * radius;
                const explosion = new Particle(gen.pos[0] + dx, gen.pos[1], gen.pos[2] + dz);
                explosion.size = 1;
                explosion.color = 0xff4080ff;
                explosion.velocity[0] = dx;
                explosion.velocity[1] = 0.5;
                explosion.velocity[2] = dz;
                return explosion;
              } else {
                return undefined;
              }
            }
          )
        );
      }
    }
    super.update();
  }

  render(): void {
    // Center height is 6
    // Primary radius is 4

    // Draw the main white
    {
      const m = this.createSphere(this.getFlashingColor(0xffe0e0f4));
      translateMat4(m, m, fromValuesVec3(0, 8, 0));
      scaleMat4(m, m, fromValuesVec3(4, 4, 4));
    }

    // Draw the red
    {
      let color = 0xff202080;
      if (this.attackState === ATTACK_STATE_CHARGING) {
        const charge = (gameTime - this.attackStateStartTime) / this.attackState.duration;
        color = (0xff202080 + charge * 127) | 0;
        {
          const m = drawLists[DYNAMIC_SPHERES].addInstance(color);
          translateMat4(m, m, this.lockPosition);
          scaleMat4(m, m, fromValuesVec3(charge * 8, charge * 0.5, charge * 8));
        }
      }
      if (this.attackState === ATTACK_STATE_SHOOTING) {
        color = 0xff2020ff;
      }

      const m = this.createSphere(this.getFlashingColor(color));
      translateMat4(m, m, fromValuesVec3(0, 8, 3.8));
      scaleMat4(m, m, fromValuesVec3(1.5, 1.5, 0.3));
    }

    // Draw the black
    {
      const m = this.createSphere(this.getFlashingColor(0xff202020));
      translateMat4(m, m, fromValuesVec3(0, 8, 3.95));
      scaleMat4(m, m, fromValuesVec3(1, 1, 0.2));
    }
  }
}
