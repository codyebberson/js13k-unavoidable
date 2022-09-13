/**
 * Player acceleration (meters per second per second).
 */
export const ACCELERATION = 500.0;

/**
 * Player friction.
 */
export const FRICTION = 17.0;

/**
 * Gravitational force (meters per second per second).
 */
export const GRAVITY = 160;

/**
 * Lesser gravity when player is still holding the jump button.
 */
export const FLOATY_GRAVITY = 20;

/**
 * Grace time in seconds where the player can still jump.
 * For example, if they walk of a ledge, they can still jump for a brief period of time.
 */
export const JUMP_GRACE_TIME = 0.25;

/**
 * Jump speed at time of jump (meters per second).
 */
export const JUMP_POWER = 12;

/**
 * Maximum x coordinate on the map.
 */
export const MAX_X = 32;

/**
 * Maximum y coordinate on the map.
 */
export const MAX_Y = 64;

/**
 * Maximum z coordinate on the map.
 */
export const MAX_Z = 32;

/**
 * Size of one tile in meters.
 */
export const TILE_SIZE = 1;

export const DASH_DURATION = 0.2;

export const DASH_COOLDOWN = 0.5;

export const PLAYER_HEIGHT = 8.0;

export const DASH_STAMINA_COST = 20;

export const SWING_STAMINA_COST = 10;
