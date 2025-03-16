/**
 * Diagnostic utilities for the CubTEK Coding Standard extension.
 * Provides tools for creating, filtering, and processing diagnostics.
 * @module src/utils/diagnostics
 */

import * as vscode from "vscode";
import { ConfigManager } from "./config";
import { Logger } from "./logger";

/**
 * Enum representing the type of code location where a diagnostic occurs.
 * Used to determine the most appropriate highlighting strategy.
 * @enum {string}
 */
export enum DiagnosticLocationType {
  /** Diagnostics related to function declarations or definitions */
  Function = "function",

  /** Diagnostics related to variable declarations or usage */
  Variable = "variable",

  /** Diagnostics related to code statements */
  Statement = "statement",

  /** Diagnostics related to expressions */
  Expression = "expression",

  /** Diagnostics related to comments */
  Comment = "comment",

  /** Diagnostics related to include directives */
  Include = "include",

  /** Diagnostics related to type definitions */
  Typedef = "typedef",

  /** Diagnostics related to macro definitions or usage */
  Macro = "macro",
}

/**
 * Mapping of severity strings to VSCode DiagnosticSeverity enum values.
 * @type {Record<string, vscode.DiagnosticSeverity>}
 */
const severityMap: Record<string, vscode.DiagnosticSeverity> = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  information: vscode.DiagnosticSeverity.Information,
  hint: vscode.DiagnosticSeverity.Hint,
};

/**
 * Utility class providing methods for creating and manipulating diagnostics.
 * Used by rules and checkers to create consistent diagnostic messages.
 */
export class DiagnosticUtility {
  /**
   * Creates a new DiagnosticUtility instance.
   *
   * @param {ConfigManager} configManager - The configuration manager to use for rule settings
   */
  constructor(private readonly configManager: ConfigManager) {}

  /**
   * Creates a fully configured diagnostic object with appropriate severity and metadata.
   *
   * @param {vscode.TextDocument} document - The document where the diagnostic occurs
   * @param {vscode.Range} range - The range in the document where the diagnostic applies
   * @param {string} message - The diagnostic message to display to the user
   * @param {string} ruleId - The ID of the rule that produced this diagnostic
   * @param {DiagnosticLocationType} [locationType=DiagnosticLocationType.Statement] - The type of code location
   * @returns {vscode.Diagnostic} A fully configured diagnostic object
   *
   * @example
   * // Create a basic diagnostic for a style issue
   * const diagnostic = diagnosticUtility.createDiagnostic(
   *   document,
   *   range,
   *   "Missing space after if keyword",
   *   "CUBTEK-STYLE-001"
   * );
   */
  createDiagnostic(
    document: vscode.TextDocument,
    range: vscode.Range,
    message: string,
    ruleId: string,
    locationType: DiagnosticLocationType = DiagnosticLocationType.Statement
  ): vscode.Diagnostic {
    // Get rule configuration
    const ruleConfig = this.configManager.getRuleConfig(ruleId);
    const config = this.configManager.getConfig();

    // Determine diagnostic severity
    let severityString = ruleConfig?.severity || config.severity;
    let severity =
      severityMap[severityString] || vscode.DiagnosticSeverity.Warning;

    // Create diagnostic object
    const diagnostic = new vscode.Diagnostic(range, message, severity);

    // Set additional information
    diagnostic.source = "CubTEK";
    diagnostic.code = ruleId;

    // Add relevant metadata (for quick fixes and reporting)
    diagnostic.tags = [];

    // Add specific tags based on rule type
    if (ruleId.includes("STYLE") || ruleId.includes("FORMAT")) {
      diagnostic.tags.push(vscode.DiagnosticTag.Unnecessary);
    }

    if (ruleId.includes("SECURE") || ruleId.includes("ROBUST")) {
      diagnostic.tags.push(vscode.DiagnosticTag.Deprecated);
    }

    // Log diagnostic message
    Logger.debug(
      "Created diagnostic for {0}: {1} at line {2}",
      ruleId,
      message,
      range.start.line + 1
    );

    return diagnostic;
  }

  /**
   * Creates a diagnostic specifically for variable naming issues.
   * Formats the message consistently for naming convention violations.
   *
   * @param {vscode.TextDocument} document - The document containing the variable
   * @param {string} varName - The name of the variable with the issue
   * @param {vscode.Range} varRange - The range where the variable is defined
   * @param {string} expectedPrefix - The expected prefix for the variable
   * @param {string} ruleId - The ID of the naming rule
   * @returns {vscode.Diagnostic} A diagnostic for the naming issue
   *
   * @example
   * // Create a diagnostic for a global variable missing a prefix
   * const diagnostic = diagnosticUtility.createVariableNamingDiagnostic(
   *   document,
   *   "count",
   *   range,
   *   "g_",
   *   "CUBTEK-NAME-001"
   * );
   */
  createVariableNamingDiagnostic(
    document: vscode.TextDocument,
    varName: string,
    varRange: vscode.Range,
    expectedPrefix: string,
    ruleId: string
  ): vscode.Diagnostic {
    const message = `Variable "${varName}" should use the "${expectedPrefix}" prefix`;
    return this.createDiagnostic(
      document,
      varRange,
      message,
      ruleId,
      DiagnosticLocationType.Variable
    );
  }

  /**
   * Creates a diagnostic for function length issues.
   * Used to flag functions that exceed the maximum allowed length.
   *
   * @param {vscode.TextDocument} document - The document containing the function
   * @param {string} funcName - The name of the function that's too long
   * @param {vscode.Range} funcRange - The range of the function header
   * @param {number} lineCount - The actual number of lines in the function
   * @param {number} maxAllowed - The maximum allowed number of lines
   * @param {string} ruleId - The ID of the function length rule
   * @returns {vscode.Diagnostic} A diagnostic for the function length issue
   *
   * @example
   * // Create a diagnostic for a function that's too long
   * const diagnostic = diagnosticUtility.createFunctionLengthDiagnostic(
   *   document,
   *   "processData",
   *   functionHeaderRange,
   *   120,
   *   50,
   *   "CUBTEK-FUNC-001"
   * );
   */
  createFunctionLengthDiagnostic(
    document: vscode.TextDocument,
    funcName: string,
    funcRange: vscode.Range,
    lineCount: number,
    maxAllowed: number,
    ruleId: string
  ): vscode.Diagnostic {
    const message = `Function "${funcName}" is ${lineCount} lines long (maximum allowed is ${maxAllowed} lines)`;
    return this.createDiagnostic(
      document,
      funcRange,
      message,
      ruleId,
      DiagnosticLocationType.Function
    );
  }

  /**
   * Creates a diagnostic for style-related issues.
   * Used for formatting, whitespace, and style convention violations.
   *
   * @param {vscode.TextDocument} document - The document containing the style issue
   * @param {vscode.Range} range - The range where the style issue occurs
   * @param {string} styleProblem - Description of the style problem
   * @param {string} ruleId - The ID of the style rule
   * @returns {vscode.Diagnostic} A diagnostic for the style issue
   *
   * @example
   * // Create a diagnostic for a style issue
   * const diagnostic = diagnosticUtility.createStyleDiagnostic(
   *   document,
   *   range,
   *   "Braces should be on a new line",
   *   "CUBTEK-STYLE-002"
   * );
   */
  createStyleDiagnostic(
    document: vscode.TextDocument,
    range: vscode.Range,
    styleProblem: string,
    ruleId: string
  ): vscode.Diagnostic {
    return this.createDiagnostic(
      document,
      range,
      styleProblem,
      ruleId,
      DiagnosticLocationType.Statement
    );
  }

  /**
   * Finds all occurrences of a symbol in a document.
   * Used for quick fixes and refactoring operations.
   *
   * @param {vscode.TextDocument} document - The document to search in
   * @param {string} symbolName - The symbol name to find
   * @returns {vscode.Range[]} An array of ranges for all occurrences of the symbol
   *
   * @example
   * // Find all occurrences of a variable name
   * const ranges = diagnosticUtility.findAllSymbolReferences(document, "count");
   */
  findAllSymbolReferences(
    document: vscode.TextDocument,
    symbolName: string
  ): vscode.Range[] {
    const text = document.getText();
    const ranges: vscode.Range[] = [];

    // Find complete symbols (avoid partial matches)
    const symbolRegex = new RegExp(
      `\\b${this.escapeRegExp(symbolName)}\\b`,
      "g"
    );
    let match: RegExpExecArray | null;

    while ((match = symbolRegex.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      ranges.push(new vscode.Range(startPos, endPos));
    }

    return ranges;
  }

  /**
   * Finds the most appropriate range to highlight for a diagnostic.
   * Attempts to identify the relevant code element instead of highlighting the entire line.
   *
   * @param {vscode.TextDocument} document - The document containing the line
   * @param {number} lineIndex - The zero-based line index to analyze
   * @param {DiagnosticLocationType} locationType - The type of code location to find
   * @param {string} [identifierHint] - Optional hint to help find the relevant identifier
   * @returns {vscode.Range} The best range to highlight for the diagnostic
   *
   * @example
   * // Find the best range for a function name diagnostic
   * const range = diagnosticUtility.findBestDiagnosticRange(
   *   document,
   *   10,
   *   DiagnosticLocationType.Function,
   *   "processData"
   * );
   */
  findBestDiagnosticRange(
    document: vscode.TextDocument,
    lineIndex: number,
    locationType: DiagnosticLocationType,
    identifierHint?: string
  ): vscode.Range {
    // Get the full line text
    const line = document.lineAt(lineIndex);
    const lineText = line.text;

    // If there's a hint for the identifier, try to find its position in the line
    if (identifierHint) {
      const identifierRegex = new RegExp(
        `\\b${this.escapeRegExp(identifierHint)}\\b`
      );
      const match = lineText.match(identifierRegex);

      if (match && match.index !== undefined) {
        const startPos = new vscode.Position(lineIndex, match.index);
        const endPos = new vscode.Position(
          lineIndex,
          match.index + match[0].length
        );
        return new vscode.Range(startPos, endPos);
      }
    }

    // Find the best position based on the problem type
    switch (locationType) {
      case DiagnosticLocationType.Function:
        // Look for function definition
        const funcMatch = lineText.match(/\b\w+\s+(\w+)\s*\(/);
        if (funcMatch && funcMatch.index !== undefined) {
          const nameIndex =
            funcMatch.index + funcMatch[0].indexOf(funcMatch[1]);
          const startPos = new vscode.Position(lineIndex, nameIndex);
          const endPos = new vscode.Position(
            lineIndex,
            nameIndex + funcMatch[1].length
          );
          return new vscode.Range(startPos, endPos);
        }
        break;

      case DiagnosticLocationType.Variable:
        // Look for variable name
        const varMatch = lineText.match(/\b\w+\s+(\w+)\s*[=;[\s]/);
        if (varMatch && varMatch.index !== undefined) {
          const nameIndex = varMatch.index + varMatch[0].indexOf(varMatch[1]);
          const startPos = new vscode.Position(lineIndex, nameIndex);
          const endPos = new vscode.Position(
            lineIndex,
            nameIndex + varMatch[1].length
          );
          return new vscode.Range(startPos, endPos);
        }
        break;

      case DiagnosticLocationType.Statement:
        // Skip leading whitespace
        const indentMatch = lineText.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0].length : 0;
        const startPos = new vscode.Position(lineIndex, indent);

        // If the line has a comment, exclude the comment part
        const commentIndex = lineText.indexOf("//");
        let endColumn = lineText.length;

        if (commentIndex > 0) {
          endColumn = commentIndex;
        }

        const endPos = new vscode.Position(lineIndex, endColumn);
        return new vscode.Range(startPos, endPos);

      case DiagnosticLocationType.Comment:
        // Find the start of the comment
        const commentMatch = lineText.match(/\/\//);
        if (commentMatch && commentMatch.index !== undefined) {
          const startPos = new vscode.Position(lineIndex, commentMatch.index);
          const endPos = new vscode.Position(lineIndex, lineText.length);
          return new vscode.Range(startPos, endPos);
        }
        break;

      case DiagnosticLocationType.Include:
        // Find the #include part
        const includeMatch = lineText.match(/#include\s*[<"]([^>"]+)[>"]/);
        if (includeMatch && includeMatch.index !== undefined) {
          const startPos = new vscode.Position(lineIndex, includeMatch.index);
          const endPos = new vscode.Position(
            lineIndex,
            includeMatch.index + includeMatch[0].length
          );
          return new vscode.Range(startPos, endPos);
        }
        break;
    }

    // Default to returning the whole line
    return line.range;
  }

  /**
   * Cleans C/C++ code by removing comments and string literals for analysis.
   * Useful for pattern matching and structure analysis without interference from comments or strings.
   *
   * @param {string} code - The original source code
   * @returns {string} The cleaned code with comments and strings removed/replaced
   *
   * @example
   * // Clean code for analysis
   * const cleanedCode = diagnosticUtility.cleanCodeForAnalysis(sourceCode);
   * const hasMultipleReturns = cleanedCode.match(/\breturn\b/g).length > 1;
   */
  cleanCodeForAnalysis(code: string): string {
    // Replace all string literals
    let cleanedCode = code.replace(/"(?:[^"\\]|\\.)*"/g, '""');

    // Replace all single-line comments
    cleanedCode = cleanedCode.replace(/\/\/.*$/gm, "");

    // Replace all multi-line comments
    cleanedCode = cleanedCode.replace(/\/\*[\s\S]*?\*\//g, "");

    return cleanedCode;
  }

  /**
   * Filters and sorts diagnostics based on severity and rule IDs.
   * Useful for displaying the most relevant diagnostics to the user.
   *
   * @param {vscode.Diagnostic[]} diagnostics - The array of diagnostics to filter and sort
   * @param {vscode.DiagnosticSeverity} [severityThreshold] - Optional threshold to filter by severity
   * @param {string[]} [ruleFilter] - Optional array of rule IDs to include
   * @returns {vscode.Diagnostic[]} Filtered and sorted diagnostics
   *
   * @example
   * // Filter to show only errors and warnings from style rules
   * const filtered = diagnosticUtility.filterAndSortDiagnostics(
   *   allDiagnostics,
   *   vscode.DiagnosticSeverity.Warning,
   *   ['CUBTEK-STYLE']
   * );
   */
  filterAndSortDiagnostics(
    diagnostics: vscode.Diagnostic[],
    severityThreshold?: vscode.DiagnosticSeverity,
    ruleFilter?: string[]
  ): vscode.Diagnostic[] {
    let filtered = [...diagnostics];

    // Filter by severity threshold
    if (severityThreshold !== undefined) {
      filtered = filtered.filter((d) => d.severity <= severityThreshold);
    }

    // Filter by rule IDs
    if (ruleFilter && ruleFilter.length > 0) {
      filtered = filtered.filter((d) => {
        const ruleId = d.code ? d.code.toString() : "";
        return ruleFilter.some((rule) => ruleId.includes(rule));
      });
    }

    // Sort by severity and line number
    filtered.sort((a, b) => {
      // First sort by severity (errors first)
      if (a.severity !== b.severity) {
        return a.severity - b.severity;
      }

      // Then sort by line number
      return a.range.start.line - b.range.start.line;
    });

    return filtered;
  }

  /**
   * Converts clang-tidy diagnostic output to VSCode diagnostic objects.
   * Enables integration of clang-tidy results with the extension's diagnostics.
   *
   * @param {vscode.TextDocument} document - The document being analyzed
   * @param {string} tidyOutput - The raw output from clang-tidy
   * @param {number} line - The 1-based line number from clang-tidy
   * @param {number} column - The 1-based column number from clang-tidy
   * @param {string} message - The diagnostic message from clang-tidy
   * @param {string} ruleId - The clang-tidy rule ID (e.g., "readability-identifier-naming")
   * @param {string} level - The severity level from clang-tidy (error, warning, etc.)
   * @returns {vscode.Diagnostic} A VSCode diagnostic representing the clang-tidy issue
   *
   * @example
   * // Parse a clang-tidy output into a VSCode diagnostic
   * const diagnostic = diagnosticUtility.parseClangTidyDiagnostic(
   *   document,
   *   rawOutput,
   *   15,  // line
   *   10,  // column
   *   "variable 'count' should be named 'g_count'",
   *   "readability-identifier-naming",
   *   "warning"
   * );
   */
  parseClangTidyDiagnostic(
    document: vscode.TextDocument,
    tidyOutput: string,
    line: number,
    column: number,
    message: string,
    ruleId: string,
    level: string
  ): vscode.Diagnostic {
    // Determine severity
    let severity: vscode.DiagnosticSeverity;
    switch (level.toLowerCase()) {
      case "error":
        severity = vscode.DiagnosticSeverity.Error;
        break;
      case "warning":
        severity = vscode.DiagnosticSeverity.Warning;
        break;
      case "note":
      case "remark":
        severity = vscode.DiagnosticSeverity.Information;
        break;
      default:
        severity = vscode.DiagnosticSeverity.Warning;
    }

    // Create range (VSCode positions are 0-based)
    const startPos = new vscode.Position(line - 1, column - 1);

    // Try to find the scope of the problem
    let endPos: vscode.Position;
    try {
      const lineText = document.lineAt(line - 1).text;

      // Find end of line or next punctuation
      let endColumn = lineText.length;
      const punctuationIndex = lineText.indexOf(";", column - 1);
      if (punctuationIndex > 0) {
        endColumn = punctuationIndex + 1;
      }

      endPos = new vscode.Position(line - 1, endColumn);
    } catch (error) {
      // If there's an error, default to the entire line
      endPos = new vscode.Position(line - 1, 1000);
    }

    const range = new vscode.Range(startPos, endPos);

    // Create diagnostic
    const diagnostic = new vscode.Diagnostic(range, message, severity);

    diagnostic.source = "CubTEK (clang-tidy)";
    diagnostic.code = ruleId;

    return diagnostic;
  }

  /**
   * Escapes special characters in a string for use in a regular expression.
   * Ensures that symbols with special meaning in regex are interpreted literally.
   *
   * @private
   * @param {string} string - The string to escape
   * @returns {string} The escaped string safe for use in a RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
