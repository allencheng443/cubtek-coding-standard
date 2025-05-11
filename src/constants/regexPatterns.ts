/**
 * Regular expression patterns used for code analysis.
 */

// Patterns for C/C++ syntax elements
export const CPP_PATTERNS = {
  // Global variable declaration pattern
  GLOBAL_VAR:
    /\b(?:extern|static)?\s+(?:const\s+)?(?:unsigned\s+)?(?:int|char|float|double|bool|void|\w+_t)\s+(\w+)\s*(?:=|;|\[)/g,

  // Function declaration pattern
  FUNCTION: /\b(\w+)\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?\s*{/g,

  // Class/struct definition pattern
  CLASS:
    /\b(?:class|struct)\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+\w+)?\s*{/g,

  // Include directive pattern
  INCLUDE: /#include\s*[<"]([^>"]+)[>"]/g,

  // Comment pattern
  COMMENT: /\/\/.*$|\/\*[\s\S]*?\*\//gm,

  // Clang-tidy output pattern
  CLANG_TIDY_OUTPUT: /(.+):(\d+):(\d+):\s+(warning|error):\s+(.+?)\s+\[(.+)\]/,
};

// Patterns for variable naming conventions
export const NAMING_PATTERNS = {
  CAMEL_CASE: /^[a-z][a-zA-Z0-9]*$/,
  PASCAL_CASE: /^[A-Z][a-zA-Z0-9]*$/,
  GLOBAL_PREFIX: /^g_[a-zA-Z0-9]+$/,
  CONSTANT: /^[A-Z][A-Z0-9_]*$/,
  MACRO: /^[A-Z][A-Z0-9_]*$/,
};
