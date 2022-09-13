import { DEBUG, log } from './debug';
import { gl } from './globals';
import {
  ATTRIBUTE_COLOR,
  ATTRIBUTE_POSITION,
  ATTRIBUTE_TEXCOORD,
  ATTRIBUTE_WORLDMATRIX,
  BLOOM_FRAG,
  BLOOM_VERT,
  MAIN_FRAG,
  MAIN_VERT,
  POST_FRAG,
  POST_VERT,
  SHADOW_FRAG,
  SHADOW_VERT,
  UNIFORM_BLOOMTEXTURE,
  UNIFORM_CAMERAPOSITION,
  UNIFORM_COLORTEXTURE,
  UNIFORM_DEPTHTEXTURE,
  UNIFORM_FOCUSFAR,
  UNIFORM_FOCUSNEAR,
  UNIFORM_FOCUSPOSITION,
  UNIFORM_ITERATION,
  UNIFORM_LIGHTCOLORS,
  UNIFORM_LIGHTPOSITIONS,
  UNIFORM_PROJECTIONMATRIX,
  UNIFORM_SHADOWMAPMATRIX,
  UNIFORM_TIME,
  UNIFORM_VIEWMATRIX,
} from './shaders';

//
// Standard input attributes positions
// These are shared across all programs.
//

export const positionAttrib = 0;
export const colorAttrib = 1;
export const worldMatrixAttrib = 2; // Must be last!  Matrices are multiple attributes

//
// Shadow program
// Renders geometry from the perspective of the light.
// Renders to a depth buffer for shadow mapping.
//

export const shadowProgram = initShaderProgram(SHADOW_VERT, SHADOW_FRAG, true);
export const viewMatrixUniform1 = getUniform(shadowProgram, UNIFORM_VIEWMATRIX);
export const projectionMatrixUniform1 = getUniform(shadowProgram, UNIFORM_PROJECTIONMATRIX);

//
// Main program
// Primary renderer from the perspective of the camera.
// Renders to a color buffer and a depth buffer.
//

export const mainProgram = initShaderProgram(MAIN_VERT, MAIN_FRAG, true);
export const mainTimeUniform = getUniform(mainProgram, UNIFORM_TIME);
export const mainCameraPositionUniform = getUniform(mainProgram, UNIFORM_CAMERAPOSITION);
export const mainFocusPositionUniform = getUniform(mainProgram, UNIFORM_FOCUSPOSITION);
export const viewMatrixUniform2 = getUniform(mainProgram, UNIFORM_VIEWMATRIX);
export const projectionMatrixUniform2 = getUniform(mainProgram, UNIFORM_PROJECTIONMATRIX);
export const shadowMapMatrixUniform = getUniform(mainProgram, UNIFORM_SHADOWMAPMATRIX);
export const depthTextureSamplerUniform = getUniform(mainProgram, UNIFORM_DEPTHTEXTURE);
export const lightColorsUniform = getUniform(mainProgram, UNIFORM_LIGHTCOLORS);
export const lightPositionsUniform = getUniform(mainProgram, UNIFORM_LIGHTPOSITIONS);
export const lightColors = new Float32Array(3 * 16);
export const lightPositions = new Float32Array(3 * 16);

for (let i = 0; i < lightPositions.length; i++) {
  lightPositions[i] = 1000000;
}

//
// Bloom program
// Renders the glow / bloom effect.
//

export const bloomProgram = initShaderProgram(BLOOM_VERT, BLOOM_FRAG);
export const bloomColorTextureUniform = getUniform(bloomProgram, UNIFORM_COLORTEXTURE);
export const bloomIterationUniform = getUniform(bloomProgram, UNIFORM_ITERATION);

//
// Depth of field program
// Renders the depth of field effect.
//

export const depthOfFieldProgram = initShaderProgram(POST_VERT, POST_FRAG);
export const depthOfFieldPositionAttrib = gl.getAttribLocation(depthOfFieldProgram, ATTRIBUTE_POSITION);
export const depthOfFieldTexCoordAttrib = gl.getAttribLocation(depthOfFieldProgram, ATTRIBUTE_TEXCOORD);
export const depthOfFieldColorTextureUniform = getUniform(depthOfFieldProgram, UNIFORM_COLORTEXTURE);
export const depthOfFieldDepthTextureUniform = getUniform(depthOfFieldProgram, UNIFORM_DEPTHTEXTURE);
export const depthOfFieldBloomTextureUniform = getUniform(depthOfFieldProgram, UNIFORM_BLOOMTEXTURE);
export const depthOfFieldFocusNearUniform = getUniform(depthOfFieldProgram, UNIFORM_FOCUSNEAR);
export const depthOfFieldFocusFarUniform = getUniform(depthOfFieldProgram, UNIFORM_FOCUSFAR);

export const depthOfFieldVao = gl.createVertexArray() as WebGLVertexArrayObject;
gl.bindVertexArray(depthOfFieldVao);

/**
 * Position coordinates buffer.
 * This is the static, flat, two triangle (one quad) buffer
 * that is used for post processing effects.
 */
const depthOfFieldPositionBuffer = gl.createBuffer() as WebGLBuffer;
gl.bindBuffer(gl.ARRAY_BUFFER, depthOfFieldPositionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    // Top-left
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
    // Bottom-right
    1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(depthOfFieldPositionAttrib);
gl.vertexAttribPointer(depthOfFieldPositionAttrib, 2, gl.FLOAT, false, 0, 0);

/**
 * Texture coordinates buffer.
 * This is the static, flat, two triangle (one quad) buffer
 * that is used for post processing effects.
 */
const depthOfFieldTextureBuffer = gl.createBuffer() as WebGLBuffer;
gl.bindBuffer(gl.ARRAY_BUFFER, depthOfFieldTextureBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    // Top-left
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
    // Bottom-right
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(depthOfFieldTexCoordAttrib);
gl.vertexAttribPointer(depthOfFieldTexCoordAttrib, 2, gl.FLOAT, false, 0, 0);

/**
 * Creates the WebGL program.
 * Basic WebGL setup
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
 * @param vertexShaderSource
 * @param fragmentShaderSource
 * @param bindAttribs
 * @returns
 */
function initShaderProgram(
  vertexShaderSource: string,
  fragmentShaderSource: string,
  bindAttribs?: boolean
): WebGLProgram {
  const vertexShader = loadShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram() as WebGLProgram;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  if (bindAttribs) {
    gl.bindAttribLocation(program, positionAttrib, ATTRIBUTE_POSITION);
    gl.bindAttribLocation(program, colorAttrib, ATTRIBUTE_COLOR);
    gl.bindAttribLocation(program, worldMatrixAttrib, ATTRIBUTE_WORLDMATRIX);
  }

  gl.linkProgram(program);

  if (DEBUG) {
    const compiled = gl.getProgramParameter(program, gl.LINK_STATUS);
    log('Program compiled: ' + compiled);
    const compilationLog = gl.getProgramInfoLog(program);
    log('Program compiler log: ' + compilationLog);
  }

  return program;
}

/**
 * Creates a shader.
 * @param type
 * @param source
 * @returns
 */
function loadShader(type: number, source: string): WebGLShader {
  const shader = gl.createShader(type) as WebGLShader;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (DEBUG) {
    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    log('Shader compiled: ' + compiled);
    const compilationLog = gl.getShaderInfoLog(shader);
    log('Shader compiler log: ' + compilationLog);
  }

  return shader;
}

/**
 * Returns the uniform location.
 * This is a simple wrapper, but helps with compression.
 * @param program
 * @param name
 * @returns The uniform location.
 */
function getUniform(program: WebGLProgram, name: string): WebGLUniformLocation {
  return gl.getUniformLocation(program, name) as WebGLUniformLocation;
}
