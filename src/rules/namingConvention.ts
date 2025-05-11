import * as vscode from "vscode";
import { CPP_PATTERNS, DIAGNOSTIC_MESSAGES } from "../constants";
import { Rule } from "./ruleBase";

/**
 * Rule that enforces CubTEK naming conventions in source code.
 *
 * Checks:
 * - Global variables must have a 'g_' prefix
 * - Function names must follow camelCase or PascalCase
 */
export class NamingConventionRule extends Rule {
  /**
   * Creates a new naming convention rule instance.
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
   * Analyzes the document for naming convention violations.
   *
   * @param document The document to analyze
   * @return Array of diagnostics for naming issues found
   */
  async check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    // Check global variable naming (should start with g_)
    const globalVarPattern = CPP_PATTERNS.GLOBAL_VAR;
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

        const message = DIAGNOSTIC_MESSAGES.GLOBAL_VAR_PREFIX(varName);

        const diagnostic = this.createDiagnostic(range, message);

        diagnostics.push(diagnostic);
      }
    }

    // Check function naming (should be camelCase or PascalCase)
    const functionPattern = CPP_PATTERNS.FUNCTION;

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

        const message = DIAGNOSTIC_MESSAGES.FUNCTION_NAMING(functionName);

        const diagnostic = this.createDiagnostic(range, message);

        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  /**
   * Checks if a line is inside a function body based on brace counting.
   *
   * @param document The document to analyze
   * @param lineNumber Zero-based line number to check
   * @return True if inside a function body
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
