import { Particle } from './particle';

export class FloatingText extends Particle {
  text: string;

  constructor(x: number, y: number, z: number, text: string) {
    super(x, y, z);
    this.text = text;
  }

  render(): void {
    // Do nothing
  }
}
