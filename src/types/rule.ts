/**
 * Defines interfaces for the rule system in the CubTEK linting framework.
 * @fileoverview Core type definitions for creating and managing code quality rules.
 * @see {@link https://github.com/cubtek/coding-standard}
 */

import * as vscode from "vscode";

/**
 * Metadata required for defining a rule in the CubTEK linting system.
 *
 * @example
 * const metadata: RuleMetadata = {
 *   id: "CUBTEK-STYLE-001",
 *   name: "Function Naming Convention",
 *   description: "Ensures function names use camelCase",
 *   category: "Style",
 *   defaultSeverity: vscode.DiagnosticSeverity.Warning
 * };
 */
export interface RuleMetadata {
  /** Unique identifier, format: "CUBTEK-CATEGORY-###" */
  id: string;
  /** Display name shown in UI */
  name: string;
  /** Description of what the rule checks for */
  description: string;
  /** Category group (Style, Safety, Performance, etc.) */
  category: string;
  /** Default severity if not overridden by configuration */
  defaultSeverity: vscode.DiagnosticSeverity;
}

/**
 * Interface that all rules must implement.
 *
 * @example
 * class MyCustomRule implements Rule {
 *   // Implementation of required methods
 * }
 */
export interface Rule {
  /**
   * Gets the rule's unique identifier.
   * @return The rule's ID string
   */
  getId(): string;

  /**
   * Gets the rule's display name.
   * @return The rule's name for UI display
   */
  getName(): string;

  /**
   * Gets the rule's detailed description.
   * @return The description text
   */
  getDescription(): string;

  /**
   * Gets the rule's category.
   * @return The category string
   */
  getCategory(): string;

  /**
   * Checks if the rule is enabled.
   * @return True if enabled, false otherwise
   */
  isEnabled(): boolean;

  /**
   * Enables or disables the rule.
   * @param enabled Whether to enable the rule
   */
  setEnabled(enabled: boolean): void;

  /**
   * Sets the rule's diagnostic severity level.
   * @param severity New severity level
   */
  setSeverity(severity: vscode.DiagnosticSeverity): void;

  /**
   * Analyzes a document and returns any rule violations.
   * @param document Document to check
   * @return Promise resolving to found diagnostics
   */
  check(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;
}
