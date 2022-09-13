import { InputSet } from './input';

/**
 * Flag to control whether gamepad inputs are enabled.
 * @const {boolean}
 */
const GAMEPAD_ENABLED = true;

let gamepad: Gamepad | undefined = undefined;

export const gamepadButtons = new InputSet();

/**
 * Checks if a gamepad is available.
 * Gamepads should be queried per frame.
 * https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
 */
export const updateGamepad = (): void => {
  if (GAMEPAD_ENABLED) {
    gamepad = undefined;
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        gamepad = gamepads[i] as Gamepad;
        for (let j = 0; j < gamepad.buttons.length; j++) {
          gamepadButtons.get(j).down = gamepad.buttons[j].pressed;
        }
        gamepadButtons.updateAll();
      }
    }
  }
};

export const getGamepad = (): Gamepad | undefined => {
  return gamepad;
};
