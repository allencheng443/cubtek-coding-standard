/**
 * Types of code locations where diagnostics can appear in C/C++ code.
 *
 * Used to specify where in the source code an issue was detected, enabling
 * precise diagnostic positioning and targeted quick-fixes.
 *
 * @enum {string}
 */
export enum DiagnosticLocationType {
  /** Function declarations or definitions. */
  Function = "function",

  /** Variable declarations and definitions. */
  Variable = "variable",

  /** Class or structure definitions. */
  Class = "class",

  /** Code statements within blocks (control flow, expressions, etc.). */
  Statement = "statement",

  /** Preprocessor directives (#define, #ifdef, etc.). */
  Preprocessor = "preprocessor",

  /** #include statements. */
  Include = "include",

  /** typedef declarations. */
  Typedef = "typedef",

  /** Preprocessor macro definitions and invocations. */
  Macro = "macro",

  /** Enumeration type definitions. */
  Enum = "enum",

  /** Union type definitions. */
  Union = "union",

  /** C++ namespace declarations and usages. */
  Namespace = "namespace",

  /** C++ template declarations and specializations. */
  Template = "template",

  /** Function parameters in signatures and calls. */
  Parameter = "parameter",

  /** Class/struct member variables and functions. */
  Member = "member",

  /** Inline assembly code blocks. */
  InlineAssembly = "inlineAssembly",

  /** extern declarations and linkage specifications. */
  ExternDeclaration = "externDeclaration",

  /** Line and block comments. */
  Comment = "comment",

  /** Header inclusion guard macros. */
  HeaderGuard = "headerGuard",

  /** C++11 'using' type aliases. */
  TypeAlias = "typeAlias",

  /** Code elements not fitting other categories. */
  Other = "other",
}
