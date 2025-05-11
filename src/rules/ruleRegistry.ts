/**
 * @fileoverview Provides a central registry for all code quality rules.
 * Handles rule registration, configuration, and access to rule instances.
 */

import * as vscode from "vscode";
import { ConfigManager } from "../utils/config";
import { Rule } from "./ruleBase";

// Import rule implementations
import { FunctionLengthRule } from "./functionLength";
import { NamingConventionRule } from "./namingConvention";
// Import more rules as they are implemented

/**
 * Manages and provides access to all code quality rules in the extension.
 *
 * Responsibilities include:
 * - Registering rule implementations
 * - Configuring rules based on user settings
 * - Providing access to enabled and all rules
 */
export class RuleRegistry {
  /**
   * Stores all registered rule instances, mapped by their unique identifiers.
   * @private
   */
  private rules: Map<string, Rule> = new Map();

  /**
   * Initializes a new rule registry and registers all available rules.
   *
   * @param configManager Configuration manager that provides rule settings.
   */
  constructor(private readonly configManager: ConfigManager) {
    // Register all rules
    this.registerRule(new FunctionLengthRule());
    this.registerRule(new NamingConventionRule());
    // Register more rules as they are implemented

    // Configure rules based on settings
    this.configureRules();
  }

  /**
   * Adds a rule to the registry.
   *
   * @param rule The rule instance to register.
   * @private
   */
  private registerRule(rule: Rule): void {
    this.rules.set(rule.getId(), rule);
  }

  /**
   * Applies user configuration to all registered rules.
   *
   * Configures each rule's enabled status and severity level based on
   * settings retrieved from the configuration manager.
   *
   * @private
   */
  private configureRules(): void {
    for (const [ruleId, rule] of this.rules.entries()) {
      const ruleConfig = this.configManager.getRuleConfig(ruleId);

      if (ruleConfig) {
        // Set rule enabled/disabled status
        rule.setEnabled(ruleConfig.enabled);

        // Set rule severity if specified
        if (ruleConfig.severity) {
          let severity: vscode.DiagnosticSeverity;

          switch (ruleConfig.severity) {
            case "error":
              severity = vscode.DiagnosticSeverity.Error;
              break;
            case "warning":
              severity = vscode.DiagnosticSeverity.Warning;
              break;
            case "information":
              severity = vscode.DiagnosticSeverity.Information;
              break;
            case "hint":
              severity = vscode.DiagnosticSeverity.Hint;
              break;
            default:
              severity = vscode.DiagnosticSeverity.Warning;
          }

          rule.setSeverity(severity);
        }
      }
    }
  }

  /**
   * Returns all rules that are currently enabled.
   *
   * @return An array containing all enabled rule instances.
   */
  getEnabledRules(): Rule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.isEnabled());
  }

  /**
   * Retrieves a specific rule by its identifier.
   *
   * @param ruleId The unique identifier of the rule to retrieve.
   * @return The rule instance if found, undefined otherwise.
   */
  getRuleById(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Returns all registered rules, regardless of their enabled status.
   *
   * @return An array containing all registered rule instances.
   */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }
}
