/**
 * Function Length Rule Implementation
 *
 * This module provides a rule that checks and warns about functions exceeding
 * a maximum allowed length. Long functions can be difficult to understand,
 * test, and maintain, making this rule important for code quality.
 */
import * as vscode from "vscode";
import { Rule } from "./ruleBase";

/**
 * Rule that enforces maximum function length.
 * Analyzes code to identify functions that exceed a specified line count limit.
 * @extends Rule
 */
export class FunctionLengthRule extends Rule {
  /**
   * Creates a new instance of the FunctionLengthRule.
   * Initializes the rule with its metadata including ID, name, description,
   * category, and default severity level.
   */
  constructor() {
    super({
      id: "CUBTEK-FUNC-001",
      name: "Function Length",
      description: "Functions should not exceed the maximum allowed length",
      category: "Maintainability",
      defaultSeverity: vscode.DiagnosticSeverity.Warning,
    });
  }

  /**
   * Analyzes a document to check for functions that exceed the maximum allowed length.
   *
   * @param {vscode.TextDocument} document - The document to analyze
   * @returns {Promise<vscode.Diagnostic[]>} Array of diagnostics for functions exceeding the maximum length
   */
  async check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    // Get configuration for maximum lines
    // Default to 50 if not specified
    const maxLines = 50;

    // Find all function definitions
    // This is a simplified regex for C/C++ functions
    const functionPattern = /\b(\w+)\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?\s*{/g;
    let match: RegExpExecArray | null;

    while ((match = functionPattern.exec(text)) !== null) {
      const functionPos = document.positionAt(match.index);
      const functionName = match[2];

      // Find the end of the function by counting braces
      const functionEndPos = this.findFunctionEnd(document, functionPos);

      if (functionEndPos) {
        // Calculate number of lines
        const functionLines = functionEndPos.line - functionPos.line + 1;

        // Check if function exceeds maximum length
        if (functionLines > maxLines) {
          const range = new vscode.Range(
            functionPos,
            functionPos.translate(0, functionName.length)
          );

          const diagnostic = this.createDiagnostic(
            range,
            `Function "${functionName}" is ${functionLines} lines long (maximum allowed is ${maxLines})`
          );

          diagnostics.push(diagnostic);
        }
      }
    }

    return diagnostics;
  }

  /**
   * Finds the end position of a function by tracking opening and closing braces.
   *
   * @param {vscode.TextDocument} document - The document containing the function
   * @param {vscode.Position} startPos - The starting position of the function
   * @returns {vscode.Position | null} The position of the function's closing brace, or null if not found
   * @private
   */
  private findFunctionEnd(
    document: vscode.TextDocument,
    startPos: vscode.Position
  ): vscode.Position | null {
    const text = document.getText();
    let braceCount = 0;
    let foundFirstBrace = false;

    for (let i = document.offsetAt(startPos); i < text.length; i++) {
      const char = text.charAt(i);

      if (char === "{") {
        foundFirstBrace = true;
        braceCount++;
      } else if (char === "}") {
        braceCount--;

        if (foundFirstBrace && braceCount === 0) {
          // Found the matching closing brace
          return document.positionAt(i);
        }
      }
    }

    return null; // Function end not found
  }
}
