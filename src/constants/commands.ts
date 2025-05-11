/**
 * Command identifiers and command line arguments.
 */

// Extension command IDs
export const COMMANDS = {
  CHECK_FILE: "cubtek.checkFile",
  CHECK_PROJECT: "cubtek.checkProject",
  FORMAT_FILE: "cubtek.formatFile",
  EXTRACT_DEFAULT_CONFIGS: "cubtek.extractDefaultConfigs",
};

// Command line tool arguments
export const CLANG_FORMAT_ARGS = {
  DEFAULT: [
    "-style=file", // Use .clang-format file if available
    // Don't include document-specific params here
  ],
};

export const CLANG_TIDY_ARGS = {
  DEFAULT: [
    "-quiet",
    "--export-fixes=/dev/null",
    // Don't include document-specific params here
  ],
};
