import { gl, HEIGHT, WIDTH } from './globals';

export interface FBO {
  size: number;
  colorTexture: WebGLTexture;
  depthTexture: WebGLTexture;
  frameBuffer: WebGLFramebuffer;
}

/**
 * Creates a FBO.
 * @param size Size in pixels, both width and height.
 * @returns
 */
export const createFbo = (size: number): FBO => {
  const colorTexture = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);

  const level = 0;
  {
    // define size and format of level 0
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, size, size, border, format, type, data);

    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  const depthTexture = gl.createTexture() as WebGLTexture;
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(
    gl.TEXTURE_2D, // target
    0, // mip level
    gl.DEPTH_COMPONENT32F,
    size, // width
    size, // height
    0, // border
    gl.DEPTH_COMPONENT, // format
    gl.FLOAT, // type
    null
  ); // data
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const frameBuffer = gl.createFramebuffer() as WebGLFramebuffer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, // target
    gl.COLOR_ATTACHMENT0, // attachment point
    gl.TEXTURE_2D, // texture target
    colorTexture, // texture
    0
  ); // mip level
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, // target
    gl.DEPTH_ATTACHMENT, // attachment point
    gl.TEXTURE_2D, // texture target
    depthTexture, // texture
    0
  ); // mip level

  return {
    size,
    colorTexture,
    depthTexture,
    frameBuffer,
  };
};

/**
 * Binds an FBO as the render target.
 * @param fbo
 */
export const bindFbo = (fbo: FBO): void => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.frameBuffer);
  gl.viewport(0, 0, fbo.size, fbo.size);
};

/**
 * Binds the screen as the render target.
 */
export const bindScreen = (): void => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, WIDTH, HEIGHT);
};
