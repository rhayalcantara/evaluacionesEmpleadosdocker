import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = environment.production ? LogLevel.Warn : LogLevel.Debug;

  constructor() { }

  /**
   * Log de nivel Debug - Solo visible en desarrollo
   * Útil para debugging detallado
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.Debug, message, args);
  }

  /**
   * Log de nivel Info - Información general
   * Visible en desarrollo, se puede habilitar en producción
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.Info, message, args);
  }

  /**
   * Log de nivel Warning - Advertencias
   * Visible en desarrollo y producción
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.Warn, message, args);
  }

  /**
   * Log de nivel Error - Errores críticos
   * Siempre visible, se puede integrar con sistemas de monitoreo
   */
  error(message: string, error?: Error, ...args: any[]): void {
    this.log(LogLevel.Error, message, [error, ...args]);

    // TODO: Integrar con sistema de monitoreo (Sentry, LogRocket, etc.)
    // Ejemplo:
    // if (environment.production && error) {
    //   Sentry.captureException(error);
    // }
  }

  /**
   * Método privado para realizar el logging real
   */
  private log(level: LogLevel, message: string, args: any[]): void {
    // No loggear si el nivel es menor al configurado
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}]`;

    // Filtrar datos sensibles antes de loggear
    const sanitizedArgs = this.sanitizeArgs(args);

    switch (level) {
      case LogLevel.Debug:
        if (environment.enableDebug) {
          console.debug(prefix, message, ...sanitizedArgs);
        }
        break;
      case LogLevel.Info:
        console.info(prefix, message, ...sanitizedArgs);
        break;
      case LogLevel.Warn:
        console.warn(prefix, message, ...sanitizedArgs);
        break;
      case LogLevel.Error:
        console.error(prefix, message, ...sanitizedArgs);
        break;
    }
  }

  /**
   * Sanitiza argumentos para evitar loggear información sensible
   * Reemplaza valores de campos sensibles con [REDACTED]
   */
  private sanitizeArgs(args: any[]): any[] {
    const sensitiveKeys = ['token', 'password', 'contrasena', 'passwordHash', 'jwt', 'authorization'];

    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return this.sanitizeObject(arg, sensitiveKeys);
      }
      return arg;
    });
  }

  /**
   * Sanitiza un objeto, reemplazando valores de propiedades sensibles
   */
  private sanitizeObject(obj: any, sensitiveKeys: string[]): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, sensitiveKeys));
    }

    if (obj instanceof Date || obj instanceof Error) {
      return obj;
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitized[key] = this.sanitizeObject(obj[key], sensitiveKeys);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }
    return sanitized;
  }

  /**
   * Establece el nivel de logging manualmente (útil para testing)
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Obtiene el nivel de logging actual
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}
