/**
 * Logging utility for the CubTEK Coding Standard extension.
 * Provides standardized logging capabilities with different severity levels.
 * @module src/utils/logger
 */

import * as vscode from "vscode";

/**
 * Enum representing the log levels available for logging.
 * Used to control verbosity of logging output.
 * @enum {number}
 */
export enum LogLevel {
  /** Detailed information, typically of interest only when diagnosing problems */
  Debug = 0,

  /** Informational messages that highlight normal application progress */
  Info = 1,

  /** Potentially harmful situations that might indicate problems */
  Warning = 2,

  /** Error events that might still allow the application to continue running */
  Error = 3,

  /** Critical errors that prevent normal program execution */
  Critical = 4,

  /** No logging should be performed */
  None = 99,
}

/**
 * Static utility class for logging messages with different severity levels.
 * Provides formatted logging to VS Code's output channel.
 */
export class Logger {
  /** The VS Code output channel used for displaying log messages */
  private static outputChannel: vscode.OutputChannel;

  /** The current log level threshold; messages below this level won't be logged */
  private static currentLogLevel: LogLevel = LogLevel.Info;

  /**
   * Initializes the logger with a VS Code output channel.
   * Should be called once during extension activation.
   *
   * @param {vscode.ExtensionContext} context - The extension context
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
   * Should be called when configuration changes.
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
   * Logs a debug message. Used for detailed troubleshooting information.
   *
   * @param {string} message - The message format string, with optional placeholders {0}, {1}, etc.
   * @param {...any[]} args - Arguments to be formatted into the message
   *
   * @example
   * // Log a debug message with formatting
   * Logger.debug("Processing file {0} with {1} rules", filename, ruleCount);
   */
  public static debug(message: string, ...args: any[]): void {
    this.log(LogLevel.Debug, message, ...args);
  }

  /**
   * Logs an informational message about normal application progress.
   *
   * @param {string} message - The message format string, with optional placeholders {0}, {1}, etc.
   * @param {...any[]} args - Arguments to be formatted into the message
   *
   * @example
   * // Log an info message
   * Logger.info("Found {0} style issues in the document", issues.length);
   */
  public static info(message: string, ...args: any[]): void {
    this.log(LogLevel.Info, message, ...args);
  }

  /**
   * Logs a warning message about potential problems.
   *
   * @param {string} message - The message format string, with optional placeholders {0}, {1}, etc.
   * @param {...any[]} args - Arguments to be formatted into the message
   *
   * @example
   * // Log a warning message
   * Logger.warning("Rule {0} found potential issue with coding standards", ruleId);
   */
  public static warning(message: string, ...args: any[]): void {
    this.log(LogLevel.Warning, message, ...args);
  }

  /**
   * Logs an error message about failures in the extension.
   *
   * @param {string} message - The message format string, with optional placeholders {0}, {1}, etc.
   * @param {...any[]} args - Arguments to be formatted into the message
   *
   * @example
   * // Log an error message
   * Logger.error("Failed to parse document: {0}", error.message);
   */
  public static error(message: string, ...args: any[]): void {
    this.log(LogLevel.Error, message, ...args);
  }

  /**
   * Logs a critical error message about severe failures.
   *
   * @param {string} message - The message format string, with optional placeholders {0}, {1}, etc.
   * @param {...any[]} args - Arguments to be formatted into the message
   *
   * @example
   * // Log a critical error message
   * Logger.critical("Extension failed to activate: {0}", error.message);
   */
  public static critical(message: string, ...args: any[]): void {
    this.log(LogLevel.Critical, message, ...args);
  }

  /**
   * Internal method to log a message at a specific level.
   * Handles formatting and channel output based on the current log level.
   *
   * @private
   * @param {LogLevel} level - The severity level of the message
   * @param {string} message - The message format string
   * @param {...any[]} args - Arguments to be formatted into the message
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
   * @private
   * @param {string} message - The message format string
   * @param {any[]} args - The arguments to format into the message
   * @returns {string} The formatted message
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
   * Formats a value for logging, handling objects and arrays appropriately.
   *
   * @private
   * @param {any} value - The value to format
   * @returns {string} The formatted value as a string
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
   * @private
   * @param {LogLevel} level - The log level to get a prefix for
   * @returns {string} The prefix string for the log level
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
