/**
 * Utilities for creating, filtering, and processing diagnostics.
 * @fileoverview Diagnostic tools for the CubTEK Coding Standard extension.
 */

import { DiagnosticLocationType } from "@/types";
import * as vscode from "vscode";
import { ConfigManager } from "./config";
import { Logger } from "./logger";

/**
 * Maps severity strings to VSCode DiagnosticSeverity enum values.
 * @const {!Object<string, vscode.DiagnosticSeverity>}
 */
const severityMap = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  information: vscode.DiagnosticSeverity.Information,
  hint: vscode.DiagnosticSeverity.Hint,
};

/**
 * Utility for creating and manipulating diagnostics.
 */
export class DiagnosticUtility {
  /**
   * @param {!ConfigManager} configManager Configuration manager for rule settings
   */
  constructor(private readonly configManager: ConfigManager) {}

  /**
   * Creates a diagnostic object with severity and metadata.
   *
   * @param {!vscode.TextDocument} document Document where the diagnostic occurs
   * @param {!vscode.Range} range Range where the diagnostic applies
   * @param {string} message Diagnostic message to display
   * @param {string} ruleId ID of the rule that produced this diagnostic
   * @param {DiagnosticLocationType=} locationType Type of code location
   *     (defaults to Statement)
   * @return {!vscode.Diagnostic} Configured diagnostic object
   *
   * @example
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
   * Creates a diagnostic for variable naming issues.
   *
   * @param {!vscode.TextDocument} document Document containing the variable
   * @param {string} varName Name of the variable with the issue
   * @param {!vscode.Range} varRange Range where the variable is defined
   * @param {string} expectedPrefix Expected prefix for the variable
   * @param {string} ruleId ID of the naming rule
   * @return {!vscode.Diagnostic} Diagnostic for the naming issue
   *
   * @example
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
   *
   * @param {!vscode.TextDocument} document Document containing the function
   * @param {string} funcName Name of the function that's too long
   * @param {!vscode.Range} funcRange Range of the function header
   * @param {number} lineCount Actual number of lines in the function
   * @param {number} maxAllowed Maximum allowed number of lines
   * @param {string} ruleId ID of the function length rule
   * @return {!vscode.Diagnostic} Diagnostic for the function length issue
   *
   * @example
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
   *
   * @param {!vscode.TextDocument} document Document containing the style issue
   * @param {!vscode.Range} range Range where the style issue occurs
   * @param {string} styleProblem Description of the style problem
   * @param {string} ruleId ID of the style rule
   * @return {!vscode.Diagnostic} Diagnostic for the style issue
   *
   * @example
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
   *
   * @param {!vscode.TextDocument} document Document to search in
   * @param {string} symbolName Symbol name to find
   * @return {!Array<!vscode.Range>} Ranges for all occurrences of the symbol
   *
   * @example
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
   * Finds the most appropriate range for a diagnostic.
   *
   * @param {!vscode.TextDocument} document Document containing the line
   * @param {number} lineIndex Zero-based line index to analyze
   * @param {DiagnosticLocationType} locationType Type of code location to find
   * @param {string=} identifierHint Optional hint to help find the identifier
   * @return {!vscode.Range} Best range for the diagnostic
   *
   * @example
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
   * Cleans C/C++ code by removing comments and string literals.
   *
   * @param {string} code Original source code
   * @return {string} Cleaned code with comments and strings removed
   *
   * @example
   * const cleanedCode = diagnosticUtility.cleanCodeForAnalysis(sourceCode);
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
   *
   * @param {!Array<!vscode.Diagnostic>} diagnostics Array of diagnostics to filter
   * @param {vscode.DiagnosticSeverity=} severityThreshold Optional severity threshold
   * @param {Array<string>=} ruleFilter Optional array of rule IDs to include
   * @return {!Array<!vscode.Diagnostic>} Filtered and sorted diagnostics
   *
   * @example
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
   * Converts clang-tidy output to VSCode diagnostic objects.
   *
   * @param {!vscode.TextDocument} document Document being analyzed
   * @param {string} tidyOutput Raw output from clang-tidy
   * @param {number} line 1-based line number from clang-tidy
   * @param {number} column 1-based column number from clang-tidy
   * @param {string} message Diagnostic message from clang-tidy
   * @param {string} ruleId Clang-tidy rule ID
   * @param {string} level Severity level from clang-tidy
   * @return {!vscode.Diagnostic} VSCode diagnostic representing the clang-tidy issue
   *
   * @example
   * const diagnostic = diagnosticUtility.parseClangTidyDiagnostic(
   *   document,
   *   rawOutput,
   *   15,
   *   10,
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
   *
   * @param {string} string String to escape
   * @return {string} Escaped string safe for use in a RegExp
   * @private
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
