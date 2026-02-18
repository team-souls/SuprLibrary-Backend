export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG"
}

type MetaData = Record<string, unknown>;

export class Logger {
  private static instance: Logger;
  private isDev: boolean;

  private constructor() {
    this.isDev = process.env.NODE_ENV !== "production";
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    file: string,
    message: string
  ): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${file}] ${message}`;
  }

  public info(file: string, message: string, meta?: MetaData): void {
    console.log(this.formatMessage(LogLevel.INFO, file, message));
    if (meta) console.log(meta);
  }

  public warn(file: string, message: string, meta?: MetaData): void {
    console.warn(this.formatMessage(LogLevel.WARN, file, message));
    if (meta) console.warn(meta);
  }

  public error(file: string, message: string, error?: unknown): void {
    console.error(this.formatMessage(LogLevel.ERROR, file, message));
    if (error && this.isDev) {
      console.error(error);
    }
  }

  public debug(file: string, message: string, meta?: MetaData): void {
    if (this.isDev) {
      console.debug(this.formatMessage(LogLevel.DEBUG, file, message));
      if (meta) console.debug(meta);
    }
  }
}
