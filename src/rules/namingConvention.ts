import * as vscode from "vscode";
import { Rule } from "./ruleBase";

/**
 * Rule that enforces CubTEK naming conventions in source code.
 *
 * This rule inspects documents for violations of CubTEK's naming conventions:
 * - Global variables must have a 'g_' prefix
 * - Function names must follow either camelCase or PascalCase conventions
 *
 * The rule reports warnings for any identified violations, highlighting the
 * specific identifiers that need to be renamed to comply with the conventions.
 *
 * @extends {Rule} Inherits base functionality from the Rule class
 */
export class NamingConventionRule extends Rule {
  /**
   * Initializes a new instance of the NamingConventionRule class.
   *
   * This constructor sets up the rule with predefined metadata including:
   * - A unique rule identifier (CUBTEK-NAME-001)
   * - A descriptive name and description
   * - The rule category (Style)
   * - The default severity level (Warning)
   */
  constructor() {
    super({
      id: "CUBTEK-NAME-001",
      name: "Naming Convention",
      description:
        "Variables and functions should follow CubTEK naming conventions",
      category: "Style",
      defaultSeverity: vscode.DiagnosticSeverity.Warning,
    });
  }

  /**
   * Analyzes the document text to find naming convention violations.
   *
   * This method performs two main checks:
   * 1. Verifies that global variables are prefixed with 'g_'
   * 2. Ensures function names follow camelCase or PascalCase conventions
   *
   * For each violation found, a diagnostic is created that identifies the
   * problematic identifier and provides a message explaining the issue.
   *
   * @param {vscode.TextDocument} document - The document to analyze for naming convention violations
   * @returns {Promise<vscode.Diagnostic[]>} A promise that resolves to an array of diagnostics representing the violations found
   */
  async check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    // Check global variable naming (should start with g_)
    const globalVarPattern =
      /\b(?:extern|static)?\s+(?:const\s+)?(?:unsigned\s+)?(?:int|char|float|double|bool|void|\w+_t)\s+(\w+)\s*(?:=|;|\[)/g;
    let match: RegExpExecArray | null;

    while ((match = globalVarPattern.exec(text)) !== null) {
      // Check if the line is inside a function
      const linePos = document.positionAt(match.index).line;
      const lineText = document.lineAt(linePos).text;

      // Skip if this is inside a function or is a function declaration
      if (this.isInsideFunction(document, linePos) || lineText.includes("(")) {
        continue;
      }

      const varName = match[1];
      const varPos = document.positionAt(
        match.index + match[0].indexOf(varName)
      );

      // Global variables should have g_ prefix
      if (!varName.startsWith("g_")) {
        const range = new vscode.Range(
          varPos,
          varPos.translate(0, varName.length)
        );

        const diagnostic = this.createDiagnostic(
          range,
          `Global variable "${varName}" should start with "g_" prefix`
        );

        diagnostics.push(diagnostic);
      }
    }

    // Check function naming (should be camelCase or PascalCase)
    const functionPattern = /\b(\w+)\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?\s*{/g;

    while ((match = functionPattern.exec(text)) !== null) {
      const functionName = match[2];
      const functionPos = document.positionAt(
        match.index + match[0].indexOf(functionName)
      );

      // Functions should be camelCase or PascalCase
      if (!/^[a-z][a-zA-Z0-9]*$|^[A-Z][a-zA-Z0-9]*$/.test(functionName)) {
        const range = new vscode.Range(
          functionPos,
          functionPos.translate(0, functionName.length)
        );

        const diagnostic = this.createDiagnostic(
          range,
          `Function name "${functionName}" should be camelCase or PascalCase`
        );

        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  /**
   * Determines if a given line in the document is inside a function body.
   *
   * This method works by counting opening and closing braces from the beginning
   * of the document up to the specified line. If the number of opening braces
   * exceeds closing braces, the line is considered to be inside a function body.
   *
   * This approach assumes proper code structure and may not work correctly with
   * unbalanced braces or certain code formatting styles.
   *
   * @param {vscode.TextDocument} document - The document containing the code to analyze
   * @param {number} lineNumber - The zero-based line number to check
   * @returns {boolean} True if the line is inside a function body, false otherwise
   * @private
   */
  private isInsideFunction(
    document: vscode.TextDocument,
    lineNumber: number
  ): boolean {
    const text = document.getText();
    const lines = text.split("\n");

    let braceCount = 0;

    // Count braces up to the given line
    for (let i = 0; i < lineNumber; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === "{") {
          braceCount++;
        }
        if (char === "}") {
          braceCount--;
        }
      }
    }

    return braceCount > 0;
  }
}
