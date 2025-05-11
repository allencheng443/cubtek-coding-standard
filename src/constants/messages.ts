/**
 * User-facing messages used in the extension.
 */

// Diagnostic messages
export const DIAGNOSTIC_MESSAGES = {
  GLOBAL_VAR_PREFIX: (varName: string) =>
    `Global variable "${varName}" should start with "g_" prefix`,

  FUNCTION_NAMING: (funcName: string) =>
    `Function name "${funcName}" should be camelCase or PascalCase`,

  FUNCTION_LENGTH: (funcName: string, lineCount: number, maxAllowed: number) =>
    `Function "${funcName}" is ${lineCount} lines long (maximum allowed is ${maxAllowed} lines)`,

  INCLUDE_ORDER: (include: string) =>
    `Include "${include}" is not in the correct order`,
};

// Error messages
export const ERROR_MESSAGES = {
  CONFIG_LOAD_FAILED: (path: string, error: string) =>
    `Failed to load configuration from ${path}: ${error}`,

  CLANG_FORMAT_FAILED: (error: string) => `Format error: ${error}`,

  CLANG_TIDY_FAILED: (error: string) => `Checker error: ${error}`,
};

// UI messages
export const UI_MESSAGES = {
  CHECKING_PROJECT: "Checking project files...",
  FORMATTING_FILE: "Formatting file...",
  EXTRACT_CONFIG_SUCCESS: "Default configuration files extracted successfully.",
  NO_WORKSPACE_FOLDER: "No workspace folder is open.",
};
