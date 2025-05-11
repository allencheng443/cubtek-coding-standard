/**
 * Path and file location constants.
 */

import * as path from "path";

// Configuration file names
export const CONFIG_FILES = {
  CUBTEK_CONFIG: ".cubtek.json",
  VSCODE_CONFIG: path.join(".vscode", "cubtek-config.json"),
  CLANG_FORMAT: ".clang-format",
  CLANG_TIDY: ".clang-tidy",
};

// File patterns
export const FILE_PATTERNS = {
  C_CPP_FILES: "**/*.{c,cpp,h,hpp}",
  HEADERS: "**/*.{h,hpp}",
  SOURCES: "**/*.{c,cpp}",
};

// Resource paths (relative to extension root)
export const RESOURCES = {
  DEFAULT_CONFIGS: "resources/configs",
};
