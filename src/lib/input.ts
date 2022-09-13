export interface Input {
  down: boolean;
  downCount: number;
  upCount: number;
}

/**
 * Creates a new input.
 */
export const newInput = (): Input => ({ down: false, downCount: 0, upCount: 2 });

/**
 * Updates the up/down counts for an input.
 * @param {!Input} input
 */
export function updateInput(input: Input): void {
  if (input.down) {
    input.downCount++;
    input.upCount = 0;
  } else {
    input.downCount = 0;
    input.upCount++;
  }
}

export class InputSet {
  readonly inputs: Input[] = [];

  clear(): void {
    this.inputs.length = 0;
  }

  get(key: number): Input {
    let input = this.inputs[key];
    if (!input) {
      input = newInput();
      this.inputs[key] = input;
    }
    return input;
  }

  updateAll(): void {
    this.inputs.forEach(updateInput);
  }

  isAnyDown(): boolean {
    return this.inputs.some((i) => i.down);
  }
}
