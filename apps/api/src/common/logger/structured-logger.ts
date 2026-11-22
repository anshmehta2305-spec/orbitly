import { LoggerService } from '@nestjs/common';

export function redactPii(message: string): string {
  if (typeof message !== 'string') return message;

  return message
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, 'Bearer [TOKEN_REDACTED]')
    .replace(/orb_live_[A-Fa-f0-9]{48}/gi, 'orb_live_[KEY_REDACTED]')
    .replace(/"password":\s*"[^"]+"/gi, '"password":"[REDACTED]"')
    .replace(/"secret":\s*"[^"]+"/gi, '"secret":"[REDACTED]"')
    .replace(/"accessToken":\s*"[^"]+"/gi, '"accessToken":"[REDACTED]"')
    .replace(/"refreshToken":\s*"[^"]+"/gi, '"refreshToken":"[REDACTED]"')
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[CARD_REDACTED]');
}

export class OrbitlyStructuredLogger implements LoggerService {
  private formatLog(level: string, message: any, context?: string, meta?: any) {
    const rawMessage = typeof message === 'object' ? JSON.stringify(message) : String(message);
    const sanitizedMessage = redactPii(rawMessage);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message: sanitizedMessage,
      ...(meta && typeof meta === 'object' ? meta : {}),
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logEntry);
    } else {
      const color =
        level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m';
      const reset = '\x1b[0m';
      return `[${logEntry.timestamp}] ${color}${level.toUpperCase()}${reset} [${logEntry.context}] ${logEntry.message}`;
    }
  }

  log(message: any, context?: string, meta?: any) {
    console.log(this.formatLog('info', message, context, meta));
  }

  error(message: any, trace?: string, context?: string, meta?: any) {
    console.error(this.formatLog('error', message, context, { trace, ...meta }));
  }

  warn(message: any, context?: string, meta?: any) {
    console.warn(this.formatLog('warn', message, context, meta));
  }

  debug(message: any, context?: string, meta?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatLog('debug', message, context, meta));
    }
  }

  verbose(message: any, context?: string, meta?: any) {
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log(this.formatLog('verbose', message, context, meta));
    }
  }
}
