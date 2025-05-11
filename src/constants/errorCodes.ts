/**
 * Error codes and rule identifiers used throughout the extension.
 */

// Rule IDs by category
export const RULE_IDS = {
  NAMING: {
    GLOBAL_VAR_PREFIX: "CUBTEK-NAME-001",
    FUNCTION_NAMING: "CUBTEK-NAME-002",
    PARAMETER_NAMING: "CUBTEK-NAME-003",
    CLASS_NAMING: "CUBTEK-NAME-004",
    MACRO_NAMING: "CUBTEK-NAME-005",
  },
  STYLE: {
    FUNCTION_LENGTH: "CUBTEK-STYLE-001",
    LINE_LENGTH: "CUBTEK-STYLE-002",
    INDENTATION: "CUBTEK-STYLE-003",
    BRACES: "CUBTEK-STYLE-004",
  },
  SAFETY: {
    NULL_CHECK: "CUBTEK-SAFE-001",
    ARRAY_BOUNDS: "CUBTEK-SAFE-002",
    UNINITIALIZED_VAR: "CUBTEK-SAFE-003",
  },
};

// Diagnostic severity levels
export const SEVERITY_LEVELS = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "information",
  HINT: "hint",
};

// Diagnostic sources
export const DIAGNOSTIC_SOURCES = {
  CUBTEK: "CubTEK",
  CLANG_TIDY: "CubTEK (clang-tidy)",
};
