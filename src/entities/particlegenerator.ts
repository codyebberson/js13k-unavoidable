import { entities } from '..';
import { dt } from '../lib/engine';
import { GameEntity } from './entity';
import { Particle } from './particle';

export class ParticleGenerator extends GameEntity {
  deathRate: number;
  generatorFunction: (generator: ParticleGenerator) => Particle | undefined;

  constructor(
    x: number,
    y: number,
    z: number,
    generatorFunction: (generator: ParticleGenerator) => Particle | undefined
  ) {
    super(x, y, z);
    this.damage = 50;
    this.deathRate = 100;
    this.generatorFunction = generatorFunction;
  }

  /**
   * Updates the particle.
   * @override
   */
  update(): void {
    this.health -= dt * this.deathRate;
    const p = this.generatorFunction(this);
    if (p) {
      entities.push(p);
    }
  }
}
