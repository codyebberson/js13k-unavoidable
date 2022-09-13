import { copyVec3, createVec3, setVec3, subtractVec3, Vec3 } from './math/vec3';

export interface Camera {
  source: Vec3;
  lookAt: Vec3;
  pitch: number;
  yaw: number;
  fov: number;
  near: number;
  far: number;
}

/**
 * Creates a new camera.
 * @returns
 */
export const createCamera = (): Camera => ({
  source: createVec3(),
  lookAt: createVec3(),
  pitch: 0,
  yaw: 0,
  fov: 0,
  near: 1,
  far: 1000,
});

/**
 * Sets the camera configuration.
 * @param camera
 * @param x
 * @param y
 * @param z
 * @param pitch
 * @param yaw
 * @param fov
 */
export const setCamera = (
  camera: Camera,
  x: number,
  y: number,
  z: number,
  pitch: number,
  yaw: number,
  fov: number
): void => {
  setVec3(camera.source, x, y, z);
  camera.pitch = pitch;
  camera.yaw = yaw;
  camera.fov = fov;
};

/**
 * Configures the camera to look from the source to the target.
 * @param camera
 * @param target
 * @param fov
 */
export const lookAt = (camera: Camera, target: Vec3, fov: number): void => {
  copyVec3(camera.lookAt, target);
  const tmp = createVec3();
  subtractVec3(tmp, target, camera.source);
  camera.yaw = Math.atan2(tmp[0], tmp[2]);
  camera.pitch = Math.atan2(tmp[1], Math.hypot(tmp[0], tmp[2]));
  camera.fov = fov;
};
