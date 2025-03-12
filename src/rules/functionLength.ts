// src/rules/functionLength.ts
import * as vscode from 'vscode';
import { Rule } from './ruleBase';

export class FunctionLengthRule extends Rule {
  constructor() {
    super({
      id: 'CUBTEK-FUNC-001',
      name: 'Function Length',
      description: 'Functions should not exceed the maximum allowed length',
      category: 'Maintainability',
      defaultSeverity: vscode.DiagnosticSeverity.Warning,
    });
  }

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

  private findFunctionEnd(
    document: vscode.TextDocument,
    startPos: vscode.Position
  ): vscode.Position | null {
    const text = document.getText();
    let braceCount = 0;
    let foundFirstBrace = false;

    for (let i = document.offsetAt(startPos); i < text.length; i++) {
      const char = text.charAt(i);

      if (char === '{') {
        foundFirstBrace = true;
        braceCount++;
      } else if (char === '}') {
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
