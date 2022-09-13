import { overlayCtx } from './globals';

const OVERLAY_WHITE = '#f0f0f0';
const OVERLAY_BLACK = '#000';

/**
 * Draws white text with a black shadow.
 * @param str
 * @param x
 * @param y
 * @param fillColor
 */
export function drawText(str: string, x: number, y: number, fillColor = OVERLAY_BLACK): void {
  overlayCtx.fillStyle = fillColor;
  overlayCtx.fillText(str, x, y);
}

/**
 * Draws white text with a black shadow.
 * @param str
 * @param x
 * @param y
 * @param fillColor
 */
export function drawShadowText(str: string, x: number, y: number, fillColor = OVERLAY_WHITE): void {
  drawText(str, x + 1, y + 1);
  drawText(str, x, y, fillColor);
}

/**
 * Sets the overlay context font size.
 * @param size
 * @param style
 */
export function setFontSize(size: number, style = 'bold'): void {
  overlayCtx.font = `${style} ${size}px Georgia`;
}

export function setTextAlign(alignment: CanvasTextAlign): void {
  overlayCtx.textAlign = alignment;
}

export function drawBar(
  x: number,
  y: number,
  value: number,
  maxValue: number,
  fillColor: string,
  width = 200,
  height = 6
): void {
  overlayCtx.fillStyle = '#210';
  overlayCtx.fillRect(x - 2, y - 2, width + 4, height + 4);
  overlayCtx.fillStyle = fillColor;
  overlayCtx.fillRect(x, y, (value / maxValue) * width, height);
}
