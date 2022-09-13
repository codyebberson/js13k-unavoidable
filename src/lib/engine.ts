import { player } from '..';
import { Camera, createCamera } from './camera';
import { DEBUG } from './debug';
import { DrawList } from './drawlist';
import { bindFbo, bindScreen, createFbo } from './fbo';
import { updateGamepad } from './gamepad';
import { buildCube, buildSphere } from './geometry';
import { gl, HEIGHT, overlayCtx, WIDTH } from './globals';
import { updateKeys } from './keyboard';
import {
  createMat4,
  identityMat4,
  multiplyMat4,
  perspectiveMat4,
  rotateXMat4,
  rotateYMat4,
  scaleMat4,
  translateMat4,
} from './math/mat4';
import { createVec3, fromValuesVec3, negateVec3 } from './math/vec3';
import { updateMouse } from './mouse';
import {
  bloomColorTextureUniform,
  bloomIterationUniform,
  bloomProgram,
  depthOfFieldBloomTextureUniform,
  depthOfFieldColorTextureUniform,
  depthOfFieldDepthTextureUniform,
  depthOfFieldFocusFarUniform,
  depthOfFieldFocusNearUniform,
  depthOfFieldProgram,
  depthOfFieldVao,
  depthTextureSamplerUniform,
  lightColors,
  lightColorsUniform,
  lightPositions,
  lightPositionsUniform,
  mainCameraPositionUniform,
  mainFocusPositionUniform,
  mainProgram,
  mainTimeUniform,
  projectionMatrixUniform1,
  projectionMatrixUniform2,
  shadowMapMatrixUniform,
  shadowProgram,
  viewMatrixUniform1,
  viewMatrixUniform2,
} from './programs';

const MAIN_FBO_SIZE = 2048;
const BLOOM_FBO_SIZE = 512;

export const camera = createCamera();
export const lightSource = createCamera();
export const projectionMatrix = createMat4();
export const modelViewMatrix = createMat4();

const cameraTranslate = createVec3();
const pitchMatrix = createMat4();
const yawMatrix = createMat4();
const shadowMapMatrix = createMat4();

const cubeGeometry = buildCube();
const sphereGeometry = buildSphere();

export const drawLists = [
  new DrawList(gl.STATIC_DRAW, cubeGeometry, 200000),
  new DrawList(gl.STATIC_DRAW, sphereGeometry, 200000),
  new DrawList(gl.DYNAMIC_DRAW, cubeGeometry, 4000),
  new DrawList(gl.DYNAMIC_DRAW, sphereGeometry, 2000),
];

const shadowFbo = createFbo(MAIN_FBO_SIZE);
const mainFbo = createFbo(MAIN_FBO_SIZE);
const pingPongFbo1 = createFbo(BLOOM_FBO_SIZE);
const pingPongFbo2 = createFbo(BLOOM_FBO_SIZE);

let update: (() => void) | undefined = undefined;

/**
 * Current real world time in seconds.
 */
export let time = 0;

/**
 * Current game time in seconds.
 */
export let gameTime = 0;

/**
 * Most recent game time delta in seconds.
 */
export let dt = 0;

/**
 * Last render time (milliseconds since the epoch).
 * Debug only.
 */
let lastRenderTime = 0;

/**
 * Current FPS.
 * Debug only.
 */
let fps = 0;

/**
 * Moving average FPS.
 * Debug only.
 */
let averageFps = 0;

export function init(updateFunc: () => void): void {
  update = updateFunc;
  requestAnimationFrame(render);
}

/**
 * Renders the screen.
 * @param now
 */
function render(now: number): void {
  if (DEBUG) {
    if (lastRenderTime === 0) {
      lastRenderTime = now;
    } else {
      const actualDelta = now - lastRenderTime;
      lastRenderTime = now;
      fps = 1000.0 / actualDelta;
      averageFps = 0.9 * averageFps + 0.1 * fps;
    }
  }

  // CODY
  // Set one light above the player
  lightPositions[0] = player.pos[0] + 2 * Math.sin(player.yaw);
  lightPositions[0] = player.pos[0];
  lightPositions[1] = player.pos[1] + 20;
  lightPositions[2] = player.pos[2] + 2 * Math.cos(player.yaw);
  lightPositions[2] = player.pos[2];
  lightColors[0] = 1;
  lightColors[1] = 1;
  lightColors[2] = 1;

  // Update time variables
  // Convert to seconds
  now *= 0.001;

  // Calculate the time delta
  // Maximum of 30 FPS
  // This handles the case where user comes back to browser after long time
  dt = Math.min(now - time, 1.0 / 30.0);

  // Set the current real world time
  time = now;

  // Set the current game time
  // if (gameState === GameState.PLAYING && !menu) {
  gameTime += dt;
  // }

  // Update input state
  updateKeys();
  updateMouse();
  updateGamepad();

  // Reset overlay canvas
  overlayCtx.clearRect(0, 0, WIDTH, HEIGHT);
  overlayCtx.textBaseline = 'top';

  // Reset the dynamic drawLists
  drawLists.forEach((b) => b.usage === gl.DYNAMIC_DRAW && b.resetBuffers());

  // Expect the global function "update()"
  if (update) {
    update();
  }

  // Update buffer data
  drawLists.forEach((b) => b.usage === gl.DYNAMIC_DRAW && b.updateBuffers());

  // Draw the scene twice
  // First, draw from the POV of the light
  bindFbo(shadowFbo);
  resetGl();
  setupCamera(lightSource, shadowFbo.size, shadowFbo.size);
  gl.useProgram(shadowProgram);
  gl.uniformMatrix4fv(projectionMatrixUniform1, false, projectionMatrix);
  gl.uniformMatrix4fv(viewMatrixUniform1, false, modelViewMatrix);
  renderScene();

  // Build the texture matrix that maps the world space to the depth texture
  identityMat4(shadowMapMatrix);
  translateMat4(shadowMapMatrix, shadowMapMatrix, fromValuesVec3(0.5, 0.5, 0.5));
  scaleMat4(shadowMapMatrix, shadowMapMatrix, fromValuesVec3(0.5, 0.5, 0.5));
  multiplyMat4(shadowMapMatrix, shadowMapMatrix, projectionMatrix);
  multiplyMat4(shadowMapMatrix, shadowMapMatrix, modelViewMatrix);

  // Second, draw the scene from the POV of the camera
  // Use the shadow map for lighting
  bindFbo(mainFbo);
  resetGl();
  setupCamera(camera, WIDTH, HEIGHT);
  gl.useProgram(mainProgram);
  gl.uniform1f(mainTimeUniform, gameTime);
  gl.uniform3fv(mainCameraPositionUniform, camera.source);
  gl.uniform3fv(mainFocusPositionUniform, camera.lookAt);
  gl.uniformMatrix4fv(projectionMatrixUniform2, false, projectionMatrix);
  gl.uniformMatrix4fv(viewMatrixUniform2, false, modelViewMatrix);
  gl.uniformMatrix4fv(shadowMapMatrixUniform, false, shadowMapMatrix);
  gl.uniform3fv(lightColorsUniform, lightColors);
  gl.uniform3fv(lightPositionsUniform, lightPositions);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, shadowFbo.depthTexture);
  gl.uniform1i(depthTextureSamplerUniform, 0);
  renderScene();

  // Second, draw the scene projecting the depth tecture
  // Use the ping pong technique to render back and forth between two FBOs
  // 6 iteration process:
  //  0 = filter for emissive pixels
  //  1 and 3 = blur horizontally
  //  2 and 4 = blur vertically
  //  5 = result to output
  let inputFbo = mainFbo;
  let outputFbo = pingPongFbo1;
  gl.useProgram(bloomProgram);
  for (let i = 0; i < 5; i++) {
    bindFbo(outputFbo);
    resetGl();
    gl.bindVertexArray(depthOfFieldVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputFbo.colorTexture);
    gl.uniform1i(bloomColorTextureUniform, 0);
    gl.uniform1i(bloomIterationUniform, i);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Swap drawLists
    if (i % 2 === 0) {
      inputFbo = pingPongFbo1;
      outputFbo = pingPongFbo2;
    } else {
      inputFbo = pingPongFbo2;
      outputFbo = pingPongFbo1;
    }
  }

  // Lastly, draw the post-processing effects
  // This includes the adding the bloom blur
  // and the depth-of-field blur
  bindScreen();
  gl.useProgram(depthOfFieldProgram);
  gl.clearColor(0, 0, 0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindVertexArray(depthOfFieldVao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, mainFbo.colorTexture);
  gl.uniform1i(depthOfFieldColorTextureUniform, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, mainFbo.depthTexture);
  gl.uniform1i(depthOfFieldDepthTextureUniform, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, pingPongFbo1.colorTexture);
  gl.uniform1i(depthOfFieldBloomTextureUniform, 2);
  gl.uniform1f(depthOfFieldFocusNearUniform, camera.near);
  gl.uniform1f(depthOfFieldFocusFarUniform, camera.far);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

/**
 * Render the scene using the current camera and drawLists.
 */
function renderScene(): void {
  drawLists.forEach((b) => b.render());
}

/**
 * Resets the WebGL state for a new render.
 * Clears color buffer and depth buffer.
 */
function resetGl(): void {
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  // gl.enable(gl.CULL_FACE);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Sets up the game camera.
 * @param camera
 * @param w Viewport width.
 * @param h Viewport height.
 */
function setupCamera(camera: Camera, w: number, h: number): void {
  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  const aspect = w / h;
  const zNear = 0.1;
  const zFar = 1000.0;
  perspectiveMat4(projectionMatrix, camera.fov, aspect, zNear, zFar);

  // Rotate around the X-axis by the pitch
  rotateXMat4(pitchMatrix, identityMat4(pitchMatrix), camera.pitch);

  // Rotate around the Y-axis by the yaw
  rotateYMat4(yawMatrix, identityMat4(yawMatrix), -camera.yaw);

  // Combine the pitch and yaw transformations
  multiplyMat4(modelViewMatrix, pitchMatrix, yawMatrix);

  // Finally, translate the world the opposite of the camera position
  // subtractVec3(cameraTranslate, origin, camera.source);
  negateVec3(cameraTranslate, camera.source);
  translateMat4(modelViewMatrix, modelViewMatrix, cameraTranslate);
}
