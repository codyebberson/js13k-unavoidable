import { HEIGHT, overlayCanvas, WIDTH } from './globals';
import { InputSet } from './input';

export const mouse = {
  /** Mouse x coordinate. */
  x: 0,

  /** Mouse y coordinate. */
  y: 0,

  /** Mouse buttons. */
  buttons: new InputSet(),
};

/**
 * Updates all mouse button states.
 */
export function updateMouse(): void {
  mouse.buttons.updateAll();
}

overlayCanvas.addEventListener('mousedown', (e) => {
  mouse.buttons.get(e.button).down = true;
});

overlayCanvas.addEventListener('mouseup', (e) => {
  mouse.buttons.get(e.button).down = false;
});

overlayCanvas.addEventListener('mousemove', (e) => {
  const canvasRect = overlayCanvas.getBoundingClientRect();
  mouse.x = ((e.clientX - canvasRect.left) / overlayCanvas.offsetWidth) * WIDTH;
  mouse.y = ((e.clientY - canvasRect.top) / overlayCanvas.offsetHeight) * HEIGHT;
});
