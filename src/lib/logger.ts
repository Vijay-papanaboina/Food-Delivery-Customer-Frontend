import winston from "winston";

/**
 * Winston logger for frontend application
 * Simple console-based logging without timestamps or log levels
 */
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.printf(({ message, ...meta }) => {
      const metaStr =
        Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
      return `[Frontend] ${message}${metaStr}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ message, ...meta }) => {
          const metaStr =
            Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
          return `[Frontend] ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

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
