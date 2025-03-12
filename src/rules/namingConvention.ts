// src/rules/namingConvention.ts
import * as vscode from 'vscode';
import { Rule } from './ruleBase';

export class NamingConventionRule extends Rule {
  constructor() {
    super({
      id: 'CUBTEK-NAME-001',
      name: 'Naming Convention',
      description:
        'Variables and functions should follow CubTEK naming conventions',
      category: 'Style',
      defaultSeverity: vscode.DiagnosticSeverity.Warning,
    });
  }

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
      if (this.isInsideFunction(document, linePos) || lineText.includes('(')) {
        continue;
      }

      const varName = match[1];
      const varPos = document.positionAt(
        match.index + match[0].indexOf(varName)
      );

      // Global variables should have g_ prefix
      if (!varName.startsWith('g_')) {
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

  private isInsideFunction(
    document: vscode.TextDocument,
    lineNumber: number
  ): boolean {
    const text = document.getText();
    const lines = text.split('\n');

    let braceCount = 0;

    // Count braces up to the given line
    for (let i = 0; i < lineNumber; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '{') {
          braceCount++;
        }
        if (char === '}') {
          braceCount--;
        }
      }
    }

    return braceCount > 0;
  }
}
