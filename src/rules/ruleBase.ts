/**
 * Base rule implementation and related interfaces for rule-based linting.
 * This module provides the foundation for creating and managing linting rules.
 * @module ruleBase
 */
import * as vscode from "vscode";

/**
 * Interface that defines the metadata for a linting rule.
 * Contains all identifying information and default settings for a rule.
 * @interface RuleMetadata
 */
export interface RuleMetadata {
  /** Unique identifier for the rule */
  id: string;
  /** Display name of the rule */
  name: string;
  /** Detailed description of what the rule checks for */
  description: string;
  /** Category or group that the rule belongs to */
  category: string;
  /** Default severity level for rule violations */
  defaultSeverity: vscode.DiagnosticSeverity;
}

/**
 * Abstract base class for all linting rules.
 * Provides common functionality for rule management and requires implementation of the check method.
 * @abstract
 * @class Rule
 */
export abstract class Rule {
  /**
   * Metadata that describes this rule
   * @protected
   * @readonly
   */
  protected readonly metadata: RuleMetadata;

  /**
   * Whether this rule is enabled
   * @protected
   */
  protected enabled: boolean;

  /**
   * Current severity level for this rule
   * @protected
   */
  protected severity: vscode.DiagnosticSeverity;

  /**
   * Creates a new rule instance
   * @param {RuleMetadata} metadata - The metadata that describes this rule
   */
  constructor(metadata: RuleMetadata) {
    this.metadata = metadata;
    this.enabled = true;
    this.severity = metadata.defaultSeverity;
  }

  /**
   * Gets the unique identifier for this rule
   * @returns {string} The rule's ID from its metadata
   */
  getId(): string {
    return this.metadata.id;
  }

  /**
   * Gets the display name of this rule
   * @returns {string} The rule's name from its metadata
   */
  getName(): string {
    return this.metadata.name;
  }

  /**
   * Gets the detailed description of this rule
   * @returns {string} The rule's description from its metadata
   */
  getDescription(): string {
    return this.metadata.description;
  }

  /**
   * Gets the category this rule belongs to
   * @returns {string} The rule's category from its metadata
   */
  getCategory(): string {
    return this.metadata.category;
  }

  /**
   * Checks if this rule is currently enabled
   * @returns {boolean} True if the rule is enabled, false otherwise
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables or disables this rule
   * @param {boolean} enabled - Set to true to enable the rule, false to disable it
   * @returns {void}
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Sets the severity level for rule violations
   * @param {vscode.DiagnosticSeverity} severity - The new severity level to use
   * @returns {void}
   */
  setSeverity(severity: vscode.DiagnosticSeverity): void {
    this.severity = severity;
  }

  /**
   * Check document for rule violations
   * @param {vscode.TextDocument} document - Document to check
   * @returns {Promise<vscode.Diagnostic[]>} List of diagnostics for any violations found
   */
  abstract check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;

  /**
   * Create a diagnostic for this rule
   * @param {vscode.Range} range - The range in the document where the issue occurs
   * @param {string} message - The message to display
   * @returns {vscode.Diagnostic} A diagnostic object with this rule's information
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
