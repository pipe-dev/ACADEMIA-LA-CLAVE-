export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 120;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  private initialized = false;

  constructor() {
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Ignore errors originating from external browser extensions
    const isExtensionError = (source?: string | null) => {
      if (!source) return false;
      return (
        source.includes('chrome-extension://') ||
        source.includes('moz-extension://') ||
        source.includes('safari-web-extension://') ||
        source.includes('extension://')
      );
    };

    // Capture unhandled window runtime errors
    window.addEventListener('error', (event) => {
      if (isExtensionError(event.filename) || isExtensionError(event.error?.stack)) {
        return;
      }
      this.error('GlobalWindow', event.message || 'Error de ventana no capturado', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.toString() : null,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reasonStr = event.reason ? (event.reason.stack || event.reason.toString()) : '';
      if (isExtensionError(reasonStr)) {
        return;
      }
      this.warn('UnhandledPromise', 'Promesa no gestionada rechazada', {
        reason: reasonStr || 'Desconocido',
      });
    });
  }

  public log(level: LogLevel, category: string, message: string, details?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().slice(11, 19),
      level,
      category,
      message,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Mirror to standard browser console
    const prefix = `[${entry.timestamp}] [${category}]`;
    if (level === 'error') {
      console.error(prefix, message, details || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, details || '');
    } else if (level === 'debug') {
      console.debug(prefix, message, details || '');
    } else {
      console.log(prefix, message, details || '');
    }

    this.notifyListeners();
  }

  public info(category: string, message: string, details?: any) {
    this.log('info', category, message, details);
  }

  public warn(category: string, message: string, details?: any) {
    this.log('warn', category, message, details);
  }

  public error(category: string, message: string, details?: any) {
    this.log('error', category, message, details);
  }

  public debug(category: string, message: string, details?: any) {
    this.log('debug', category, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const snapshot = this.getLogs();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  public exportLogsAsString(): string {
    return this.logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}${
            l.details ? ' -> ' + JSON.stringify(l.details) : ''
          }`
      )
      .join('\n');
  }
}

export const logger = new LoggerService();
