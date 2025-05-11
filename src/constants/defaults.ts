/**
 * Default configuration values.
 */

// Default extension settings
export const DEFAULT_SETTINGS = {
  // Formatter settings
  FORMAT_ON_SAVE: true,
  CHECK_ON_SAVE: true,

  // Default severity level
  DEFAULT_SEVERITY: "warning",

  // Default log level
  DEFAULT_LOG_LEVEL: "info",

  // Rule specific limits
  MAX_FUNCTION_LINES: 50,
  MAX_LINE_LENGTH: 80,
  TAB_SIZE: 4,
};

// Default severity map for diagnostics
export const DEFAULT_SEVERITY_MAP = {
  error: 0, // vscode.DiagnosticSeverity.Error
  warning: 1, // vscode.DiagnosticSeverity.Warning
  information: 2, // vscode.DiagnosticSeverity.Information
  hint: 3, // vscode.DiagnosticSeverity.Hint
};
