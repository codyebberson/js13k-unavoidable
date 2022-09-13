import { createVec3 } from './math/vec3';

export const WIDTH = 1920 / 2;
export const HEIGHT = 1080 / 2;

export const tempVec = createVec3();

const canvases = document.querySelectorAll('canvas');

export const canvas = canvases[0] as HTMLCanvasElement;

export const gl = canvas.getContext('webgl2', { alpha: false }) as WebGL2RenderingContext;

export const overlayCanvas = canvases[1] as HTMLCanvasElement;

export const overlayCtx = overlayCanvas.getContext('2d') as CanvasRenderingContext2D;

overlayCtx.imageSmoothingEnabled = false;

/**
 * Handles window resize event.
 * Resets the canvas dimensions to match window,
 * then draws the new borders accordingly.
 */
function handleResizeEvent(): void {
  const scale = Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT);
  const width = scale * WIDTH;
  const height = scale * HEIGHT;
  const x = (window.innerWidth - width) / 2;
  const y = (window.innerHeight - height) / 2;

  if (canvas) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.left = pixelString(x);
    canvas.style.top = pixelString(y);
    canvas.style.width = pixelString(width);
    canvas.style.height = pixelString(height);
  }
  if (overlayCanvas) {
    overlayCanvas.width = WIDTH;
    overlayCanvas.height = HEIGHT;
    overlayCanvas.style.left = pixelString(x);
    overlayCanvas.style.top = pixelString(y);
    overlayCanvas.style.width = pixelString(width);
    overlayCanvas.style.height = pixelString(height);
  }
}

/**
 * Converts a number (i.e., 123.456) to a pixel string (i.e., '123px').
 * @param num The number value.
 * @returns The pixel string value.
 */
const pixelString = (num: number): string => (num | 0) + 'px';

window.addEventListener('resize', handleResizeEvent, false);
handleResizeEvent();
