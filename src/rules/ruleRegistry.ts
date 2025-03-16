/**
 * Rule Registry module
 *
 * Provides a central registry for all code quality rules in the extension.
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
 * Registry that manages and provides access to all code quality rules in the extension.
 * Handles rule registration, configuration, and retrieval.
 */
export class RuleRegistry {
  /**
   * Map of rule IDs to rule instances
   * @private
   */
  private rules: Map<string, Rule> = new Map();

  /**
   * Creates a new RuleRegistry instance and registers all available rules.
   *
   * @param {ConfigManager} configManager - The configuration manager to retrieve rule settings
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
   * Registers a rule in the registry.
   *
   * @param {Rule} rule - The rule instance to register
   * @private
   */
  private registerRule(rule: Rule): void {
    this.rules.set(rule.getId(), rule);
  }

  /**
   * Configures all registered rules based on user settings.
   * Sets the enabled status and severity level for each rule.
   *
   * @private
   */
  private configureRules(): void {
    // Configure each rule based on settings
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
   * @returns {Rule[]} Array of enabled rule instances
   */
  getEnabledRules(): Rule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.isEnabled());
  }

  /**
   * Retrieves a specific rule by its ID.
   *
   * @param {string} ruleId - The unique identifier of the rule
   * @returns {Rule | undefined} The rule instance if found, undefined otherwise
   */
  getRuleById(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Returns all registered rules, regardless of their enabled status.
   *
   * @returns {Rule[]} Array of all registered rule instances
   */
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }
}
