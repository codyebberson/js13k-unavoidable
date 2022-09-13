import {
  BYTES_PER_COMPONENT,
  BYTES_PER_INSTANCE,
  BYTES_PER_VERTEX,
  COMPONENTS_PER_INSTANCE,
  COMPONENTS_PER_MATRIX,
  COMPONENTS_PER_VERTEX,
} from './constants';
import { DEBUG } from './debug';
import { gl } from './globals';
import { identityMat4, Mat4 } from './math/mat4';
import { colorAttrib, positionAttrib, worldMatrixAttrib } from './programs';

/**
 * The DrawList class represents a collection of WebGL buffers for a render pass.
 *
 * There are 2 buffers:
 * 1) Geometry data.  This is the same for each instance.
 * 2) Instance data.  This is different for each instance.
 *
 * Geometry data includes:
 * 1) Position coordinates (x, y, z) in unit space.
 * 2) That's it.  No color or texture data.
 *
 * Geometry therefore is 3 float components = 12 bytes.
 *
 * Instance data includes:
 * 1) A 32-bit color.
 * 2) Model matrix (4x4 transformation)
 *
 * Instance data therefore is 17 float components = 68 bytes.
 */
export class DrawList {
  readonly usage: number;
  private readonly verticesPerInstance: number;
  private readonly vao: WebGLVertexArrayObject;
  private readonly geometryBuffer: WebGLBuffer;
  private readonly instanceBuffer: WebGLBuffer;
  private readonly instanceData: Uint32Array;
  private readonly matrices: Mat4[];
  private instanceCount: number;

  /**
   * Creates a new buffer set.
   *
   * @param usage The usage pattern (either STATIC_DRAW or DYNAMIC_DRAW).
   * @param geometry The unit geometry for a single instance.
   * @param maxInstances Maximum number of instances.
   */
  constructor(usage: number, geometry: Float32Array, maxInstances: number) {
    this.usage = usage;

    this.verticesPerInstance = geometry.length / COMPONENTS_PER_VERTEX;

    this.vao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(this.vao);

    this.geometryBuffer = gl.createBuffer() as WebGLBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.geometryBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);

    // Geometry attributes
    // One vertex is [x, y, z], 3 components, 12 bytes
    gl.enableVertexAttribArray(positionAttrib);
    gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, BYTES_PER_VERTEX, 0);

    this.instanceData = new Uint32Array(maxInstances * COMPONENTS_PER_INSTANCE);

    this.instanceBuffer = gl.createBuffer() as WebGLBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, usage);

    // Instance attributes
    // Colors and model matrices are interleaved
    // One vertex is [color, mat4], 17 components, 68 bytes
    // Actually...
    // In JavaScript code, we refer to color as a single 32-bit number
    // In GLSL code, we refer to color as a vec4, composed of 4 unsigned bytes.
    gl.enableVertexAttribArray(colorAttrib);
    gl.vertexAttribPointer(colorAttrib, 4, gl.UNSIGNED_BYTE, true, BYTES_PER_INSTANCE, 0);
    gl.vertexAttribDivisor(colorAttrib, 1);

    this.matrices = new Array(maxInstances);
    for (let i = 0; i < maxInstances; i++) {
      // Find the offset for the matrix...
      // Jump to the offset for the instance (i * BYTES_PER_INSTANCE)
      // plus one component for the color (1 * BYTES_PER_COMPONENT)
      const byteOffsetToMatrix = 1 * BYTES_PER_COMPONENT + i * BYTES_PER_INSTANCE;
      this.matrices[i] = new Float32Array(this.instanceData.buffer, byteOffsetToMatrix, COMPONENTS_PER_MATRIX) as Mat4;
    }

    gl.enableVertexAttribArray(worldMatrixAttrib);

    // Set all 4 attributes for matrix
    // Technically a matrix is passed in as 4 separate vec4's
    for (let i = 0; i < 4; i++) {
      const loc = worldMatrixAttrib + i;
      gl.enableVertexAttribArray(loc);
      // Calculate the stride and offset for each matrix row
      // Stride is simple: one stride per instance -> BYTES_PER_INSTANCE
      // Offset is a little more tricky:
      // First, 8 bytes for the texture offset (2 components * 4 bytes per float)
      // Plus i * 16 for 4 floats per row * 4 bytes per float
      const offset = 4 + i * 16;
      gl.vertexAttribPointer(
        loc, // location
        4, // size (num values to pull from buffer per iteration)
        gl.FLOAT, // type of data in buffer
        false, // normalize
        BYTES_PER_INSTANCE, // stride, num bytes to advance to get to next set of values
        offset // offset in buffer
      );
      // this line says this attribute only changes for each 1 instance
      gl.vertexAttribDivisor(loc, 1);
    }

    this.instanceCount = 0;
  }

  /**
   * Resets the buffers to empty state.
   */
  resetBuffers(): void {
    this.instanceCount = 0;
  }

  /**
   * Adds a new instance to the set.
   * @param color The 32-bit color.
   * @returns
   */
  addInstance(color: number): Mat4 {
    const i = this.instanceCount++;
    if (DEBUG) {
      if (i * COMPONENTS_PER_INSTANCE >= this.instanceData.length) {
        throw new Error(
          'Out of instances ' + '(i=' + i + ', max=' + this.instanceData.length / COMPONENTS_PER_INSTANCE + ')'
        );
      }
    }
    this.instanceData[i * COMPONENTS_PER_INSTANCE] = color;
    return identityMat4(this.matrices[i]);
  }

  /**
   * Updates the WebGL buffers with the current data.
   */
  updateBuffers(): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    //gl.bufferData(gl.ARRAY_BUFFER, this.instanceData, this.usage);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceData, 0, this.instanceCount * COMPONENTS_PER_INSTANCE);
  }

  /**
   * Draws the buffer set.
   */
  render(): void {
    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.verticesPerInstance, this.instanceCount);
  }
}
