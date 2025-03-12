// src/rules/ruleBase.ts
import * as vscode from 'vscode';

export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultSeverity: vscode.DiagnosticSeverity;
}

export abstract class Rule {
  protected readonly metadata: RuleMetadata;
  protected enabled: boolean;
  protected severity: vscode.DiagnosticSeverity;

  constructor(metadata: RuleMetadata) {
    this.metadata = metadata;
    this.enabled = true;
    this.severity = metadata.defaultSeverity;
  }

  getId(): string {
    return this.metadata.id;
  }

  getName(): string {
    return this.metadata.name;
  }

  getDescription(): string {
    return this.metadata.description;
  }

  getCategory(): string {
    return this.metadata.category;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setSeverity(severity: vscode.DiagnosticSeverity): void {
    this.severity = severity;
  }

  /**
   * Check document for rule violations
   * @param document Document to check
   * @returns List of diagnostics for any violations found
   */
  abstract check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;

  /**
   * Create a diagnostic for this rule
   * @param range The range in the document where the issue occurs
   * @param message The message to display
   * @returns A diagnostic object
   */
  protected createDiagnostic(
    range: vscode.Range,
    message: string
  ): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(range, message, this.severity);

    diagnostic.source = 'CubTEK';
    diagnostic.code = this.metadata.id;

    return diagnostic;
  }
}
