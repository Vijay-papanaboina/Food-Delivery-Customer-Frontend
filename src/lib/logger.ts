/**
 * Simple console-based logger for frontend application
 */
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const metaStr =
      meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    console.log(`[Frontend] ${message}${metaStr}`);
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    const metaStr =
      meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    console.warn(`[Frontend] ${message}${metaStr}`);
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    const metaStr =
      meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    console.error(`[Frontend] ${message}${metaStr}`);
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    const metaStr =
      meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    console.debug(`[Frontend] ${message}${metaStr}`);
  },
};

/**
 * Helper function to sanitize sensitive data before logging
 * @param data - Data object to sanitize
 * @returns Sanitized data object
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  const sensitiveFields = [
    "password",
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
  ];
  const sanitized = { ...(data as Record<string, unknown>) };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}
