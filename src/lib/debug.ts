/**
 * Controls logging level.
 * When false, all logging becomes no-op, so compiled to nothing.
 */
export const DEBUG = false;

/**
 * Logs to std out.
 * Only if debug is enabled.
 * @param str
 */
export function log(str: string): void {
  if (DEBUG) {
    console.log(str);
  }
}
