/**
 * Logging utility for the CubTEK Coding Standard extension.
 */

import * as vscode from "vscode";

/**
 * Log levels for controlling logging verbosity.
 */
export enum LogLevel {
  /** Detailed information for problem diagnosis */
  Debug = 0,

  /** Normal application progress information */
  Info = 1,

  /** Potential problems */
  Warning = 2,

  /** Errors allowing application to continue running */
  Error = 3,

  /** Critical errors preventing normal execution */
  Critical = 4,

  /** No logging */
  None = 99,
}

/**
 * Static utility for logging messages with different severity levels.
 */
export class Logger {
  /** VS Code output channel for displaying logs */
  private static outputChannel: vscode.OutputChannel;

  /** Current log level threshold */
  private static currentLogLevel: LogLevel = LogLevel.Info;

  /**
   * Initializes the logger with a VS Code output channel.
   *
   * @param context Extension context
   */
  public static initialize(context: vscode.ExtensionContext): void {
    this.outputChannel = vscode.window.createOutputChannel(
      "CubTEK Coding Standard"
    );
    context.subscriptions.push(this.outputChannel);

    // Read log level from configuration
    this.updateLogLevel();

    // Log initialization
    this.info("CubTEK Coding Standard logger initialized");
  }

  /**
   * Updates the current log level from VS Code configuration.
   */
  public static updateLogLevel(): void {
    const config = vscode.workspace.getConfiguration("cubtek");
    const configLogLevel = config.get<string>("logLevel", "info");

    switch (configLogLevel.toLowerCase()) {
      case "debug":
        this.currentLogLevel = LogLevel.Debug;
        break;
      case "info":
        this.currentLogLevel = LogLevel.Info;
        break;
      case "warning":
        this.currentLogLevel = LogLevel.Warning;
        break;
      case "error":
        this.currentLogLevel = LogLevel.Error;
        break;
      case "critical":
        this.currentLogLevel = LogLevel.Critical;
        break;
      case "none":
        this.currentLogLevel = LogLevel.None;
        break;
      default:
        this.currentLogLevel = LogLevel.Info;
    }
  }

  /**
   * Logs a debug message.
   *
   * @param message Message format string with optional placeholders {0}, {1}, etc.
   * @param args Arguments to format into the message
   *
   * @example
   * Logger.debug("Processing file {0} with {1} rules", filename, ruleCount);
   */
  public static debug(message: string, ...args: any[]): void {
    this.log(LogLevel.Debug, message, ...args);
  }

  /**
   * Logs an informational message.
   *
   * @param message Message format string with optional placeholders {0}, {1}, etc.
   * @param args Arguments to format into the message
   *
   * @example
   * Logger.info("Found {0} style issues in the document", issues.length);
   */
  public static info(message: string, ...args: any[]): void {
    this.log(LogLevel.Info, message, ...args);
  }

  /**
   * Logs a warning message.
   *
   * @param message Message format string with optional placeholders {0}, {1}, etc.
   * @param args Arguments to format into the message
   *
   * @example
   * Logger.warning("Rule {0} found potential issue", ruleId);
   */
  public static warning(message: string, ...args: any[]): void {
    this.log(LogLevel.Warning, message, ...args);
  }

  /**
   * Logs an error message.
   *
   * @param message Message format string with optional placeholders {0}, {1}, etc.
   * @param args Arguments to format into the message
   *
   * @example
   * Logger.error("Failed to parse document: {0}", error.message);
   */
  public static error(message: string, ...args: any[]): void {
    this.log(LogLevel.Error, message, ...args);
  }

  /**
   * Logs a critical error message.
   *
   * @param message Message format string with optional placeholders {0}, {1}, etc.
   * @param args Arguments to format into the message
   *
   * @example
   * Logger.critical("Extension failed to activate: {0}", error.message);
   */
  public static critical(message: string, ...args: any[]): void {
    this.log(LogLevel.Critical, message, ...args);
  }

  /**
   * Logs a message at a specific level.
   *
   * @param level Severity level of the message
   * @param message Message format string
   * @param args Arguments to format into the message
   * @private
   */
  private static log(level: LogLevel, message: string, ...args: any[]): void {
    // Skip if the message's level is below the current log level threshold
    if (level < this.currentLogLevel || !this.outputChannel) {
      return;
    }

    // Format the message with the provided arguments
    const formattedMessage = this.formatMessage(message, args);

    // Get the level prefix
    const prefix = this.getLevelPrefix(level);

    // Get timestamp
    const timestamp = new Date().toISOString();

    // Format the full log line
    const logLine = `[${timestamp}] ${prefix} ${formattedMessage}`;

    // Write to the output channel
    this.outputChannel.appendLine(logLine);

    // For critical errors, also show a notification
    if (level === LogLevel.Critical) {
      vscode.window.showErrorMessage(`CubTEK: ${formattedMessage}`);
    }
  }

  /**
   * Formats a message by replacing placeholders with arguments.
   *
   * @param message Message format string
   * @param args Arguments to format into the message
   * @return Formatted message
   * @private
   */
  private static formatMessage(message: string, args: any[]): string {
    if (!args || args.length === 0) {
      return message;
    }

    return message.replace(/{(\d+)}/g, (match, index) => {
      const i = parseInt(index);
      return i >= 0 && i < args.length ? this.formatValue(args[i]) : match;
    });
  }

  /**
   * Formats a value for logging.
   *
   * @param value Value to format
   * @return Formatted value as a string
   * @private
   */
  private static formatValue(value: any): string {
    if (value === undefined) {
      return "undefined";
    }

    if (value === null) {
      return "null";
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * Gets the prefix string for a log level.
   *
   * @param level Log level to get a prefix for
   * @return Prefix string for the log level
   * @private
   */
  private static getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.Debug:
        return "[DEBUG]";
      case LogLevel.Info:
        return "[INFO]";
      case LogLevel.Warning:
        return "[WARNING]";
      case LogLevel.Error:
        return "[ERROR]";
      case LogLevel.Critical:
        return "[CRITICAL]";
      default:
        return "[INFO]";
    }
  }
}
