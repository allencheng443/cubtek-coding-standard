/**
 * @fileoverview Provides base rule implementation and interfaces for the CubTEK linting system.
 * This module contains the foundation classes and interfaces necessary for defining and
 * executing code quality rules across the codebase.
 *
 * @license MIT
 */

import * as vscode from "vscode";
import { RuleMetadata } from "../types";

/**
 * Base class that all linting rules must extend.
 *
 * Implements common functionality for rule management including ID retrieval,
 * enabling/disabling, and severity adjustment. Concrete rule implementations
 * must provide the check() method to perform the actual code analysis.
 */
export abstract class Rule {
  /**
   * The rule's metadata defining its identity and default behavior.
   * @protected
   * @readonly
   */
  protected readonly metadata: RuleMetadata;

  /**
   * Flag determining if this rule should be applied during analysis.
   * @protected
   */
  protected enabled: boolean;

  /**
   * Currently active severity level for this rule's diagnostics.
   * @protected
   */
  protected severity: vscode.DiagnosticSeverity;

  /**
   * Initializes a new rule with the provided metadata.
   * @param metadata Definition of the rule's identity and behavior.
   */
  constructor(metadata: RuleMetadata) {
    this.metadata = metadata;
    this.enabled = true;
    this.severity = metadata.defaultSeverity;
  }

  /**
   * Returns the unique identifier of this rule.
   * @return The rule's ID string.
   */
  getId(): string {
    return this.metadata.id;
  }

  /**
   * Returns the human-readable name of this rule.
   * @return The rule's display name.
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * Returns the detailed explanation of this rule's purpose.
   * @return The rule's description text.
   */
  getDescription(): string {
    return this.metadata.description;
  }

  /**
   * Returns the category this rule belongs to.
   * @return The rule's category string.
   */
  getCategory(): string {
    return this.metadata.category;
  }

  /**
   * Returns whether this rule is currently active.
   * @return True if rule is enabled, false otherwise.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Sets the active state of this rule.
   * @param enabled True to enable the rule, false to disable it.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Updates the severity level used for this rule's diagnostics.
   * @param severity The new severity level to apply.
   */
  setSeverity(severity: vscode.DiagnosticSeverity): void {
    this.severity = severity;
  }

  /**
   * Analyzes a document for violations of this rule.
   * Must be implemented by concrete rule classes.
   * @param document The text document to analyze.
   * @return A promise resolving to an array of diagnostic objects for any violations found.
   */
  abstract check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;

  /**
   * Creates a properly configured diagnostic for this rule.
   * @param range The range in the document where the violation occurs.
   * @param message Human-readable explanation of the violation.
   * @return A diagnostic object with this rule's metadata attached.
   * @protected
   */
  protected createDiagnostic(
    range: vscode.Range,
    message: string
  ): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(range, message, this.severity);

    diagnostic.source = "CubTEK";
    diagnostic.code = this.metadata.id;

    return diagnostic;
  }
}
