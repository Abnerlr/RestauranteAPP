/**
 * Environment configuration utilities
 * Provides consistent environment detection across the application
 */

/**
 * Check if the current environment is a development environment
 * Case-insensitive: 'development', 'dev', 'Development', 'DEV' all return true
 * Also accepts 'local' as a development environment
 * 
 * @param nodeEnv - The NODE_ENV value to check (optional, will use process.env.NODE_ENV if not provided)
 * @returns true if the environment is development, false otherwise
 */
export function isDevelopmentEnv(nodeEnv?: string): boolean {
  const env = (nodeEnv ?? process.env.NODE_ENV ?? '').toLowerCase().trim();
  return env === 'development' || env === 'dev' || env === 'local';
}

/**
 * Get the normalized NODE_ENV value
 * Returns lowercase, trimmed version of NODE_ENV
 * 
 * @param nodeEnv - The NODE_ENV value to normalize (optional, will use process.env.NODE_ENV if not provided)
 * @returns Normalized NODE_ENV string
 */
export function getNormalizedNodeEnv(nodeEnv?: string): string {
  return (nodeEnv ?? process.env.NODE_ENV ?? 'development').toLowerCase().trim();
}

/**
 * Get both raw and normalized NODE_ENV values
 * Useful for logging and debugging
 * 
 * @param nodeEnv - The NODE_ENV value to process (optional, will use process.env.NODE_ENV if not provided)
 * @returns Object with raw and normalized values
 */
export function getNodeEnvInfo(nodeEnv?: string): {
  raw: string | undefined;
  normalized: string;
  isDevelopment: boolean;
} {
  const raw = nodeEnv ?? process.env.NODE_ENV;
  const normalized = getNormalizedNodeEnv(raw);
  const isDevelopment = isDevelopmentEnv(raw);
  
  return {
    raw,
    normalized,
    isDevelopment,
  };
}

/**
 * Check if dev-login is enabled
 * Case-insensitive: accepts 'true', '1', 'yes', 'on' (in any case)
 * 
 * @param value - The DEV_LOGIN_ENABLED value to check (optional, will use process.env.DEV_LOGIN_ENABLED if not provided)
 * @returns true if dev-login is enabled, false otherwise
 */
export function isDevLoginEnabled(value?: string): boolean {
  const val = (value ?? process.env.DEV_LOGIN_ENABLED ?? '').toLowerCase().trim();
  return ['true', '1', 'yes', 'on'].includes(val);
}
