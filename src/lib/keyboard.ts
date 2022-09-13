import { InputSet } from './input';

export const KEY_COUNT = 256;
export const KEY_ENTER = 13;
export const KEY_SHIFT = 16;
export const KEY_ESCAPE = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_1 = 49;
export const KEY_2 = 50;
export const KEY_3 = 51;
export const KEY_4 = 52;
export const KEY_5 = 53;
export const KEY_6 = 54;
export const KEY_7 = 55;
export const KEY_8 = 56;
export const KEY_9 = 57;
export const KEY_A = 65;
export const KEY_D = 68;
export const KEY_E = 69;
export const KEY_I = 73;
export const KEY_M = 77;
export const KEY_Q = 81;
export const KEY_R = 82;
export const KEY_S = 83;
export const KEY_W = 87;
export const KEY_X = 88;
export const KEY_Z = 90;

export const keys = new InputSet();

/**
 * Updates keyboard state.
 */
export const updateKeys = (): void => {
  keys.updateAll();
};

/**
 * Resets keyboard to all keys unpressed.
 */
export const resetKeys = (): void => {
  keys.clear();
};

/**
 * Returns if the key is down.
 * @param keyCode
 * @returns
 */
export const isKeyDown = (keyCode: number): boolean => keys.get(keyCode).down;

/**
 * Returns if the key is down.
 * @param keyCode
 * @returns
 */
export const isKeyPressed = (keyCode: number): boolean => keys.get(keyCode).upCount === 1;

/**
 * Kills an event by preventing default behavior and stopping all propagation.
 * @param e
 */
const killEvent = (e: Event): void => {
  e.preventDefault();
  e.stopPropagation();
};

document.addEventListener('keydown', (e) => {
  killEvent(e);
  keys.get(e.keyCode).down = true;
});

document.addEventListener('keyup', (e) => {
  killEvent(e);
  keys.get(e.keyCode).down = false;
});

window.addEventListener('blur', resetKeys);
