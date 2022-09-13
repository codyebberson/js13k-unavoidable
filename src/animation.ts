export interface AttackState {
  duration: number;
  nextState?: AttackState;
}

/**
 * Idle state.
 */
export const ATTACK_STATE_IDLE: AttackState = { duration: -1 };

/**
 * Sword/knife is returning to idle position
 */
export const ATTACK_STATE_RETURNING: AttackState = { duration: 0.2, nextState: ATTACK_STATE_IDLE };

/**
 * Sword/knife is fully extended.
 */
export const ATTACK_STATE_EXTENDED: AttackState = { duration: 0.3, nextState: ATTACK_STATE_RETURNING };

/**
 * Sword/knife is in main swing.
 */
export const ATTACK_STATE_SWINGING: AttackState = { duration: 0.1, nextState: ATTACK_STATE_EXTENDED };

/**
 * Sword/knife is pulling back / winding up.
 */
export const ATTACK_STATE_WINDING: AttackState = { duration: 0.2, nextState: ATTACK_STATE_SWINGING };

/**
 * Sword/knife is pulling back / winding up.
 */
export const ATTACK_STATE_SLOW_WINDING: AttackState = { duration: 0.6, nextState: ATTACK_STATE_SWINGING };

/**
 * Player is dashing toward an enemy.
 */
export const ATTACK_STATE_DASH: AttackState = { duration: 2.0, nextState: ATTACK_STATE_SWINGING };

/**
 * Entity is stunned / unable to move or attack.
 */
export const ATTACK_STATE_STUNNED: AttackState = { duration: 0.5, nextState: ATTACK_STATE_IDLE };

/**
 * Entity is shooting (plus wait time after shot).
 */
export const ATTACK_STATE_SHOOTING: AttackState = { duration: 1.0, nextState: ATTACK_STATE_IDLE };

/**
 * Entity is charging up to shoot.
 */
export const ATTACK_STATE_CHARGING: AttackState = { duration: 2.0, nextState: ATTACK_STATE_SHOOTING };
