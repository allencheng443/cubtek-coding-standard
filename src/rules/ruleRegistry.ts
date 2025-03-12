// src/rules/ruleRegistry.ts
import * as vscode from 'vscode';
import { ConfigManager } from '../utils/config';
import { Rule } from './ruleBase';

// Import rule implementations
import { FunctionLengthRule } from './functionLength';
import { NamingConventionRule } from './namingConvention';
// Import more rules as they are implemented

export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();

  constructor(private readonly configManager: ConfigManager) {
    // Register all rules
    this.registerRule(new FunctionLengthRule());
    this.registerRule(new NamingConventionRule());
    // Register more rules as they are implemented

    // Configure rules based on settings
    this.configureRules();
  }

  // src/rules/ruleRegistry.ts (續)
  private registerRule(rule: Rule): void {
    this.rules.set(rule.getId(), rule);
  }

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
            case 'error':
              severity = vscode.DiagnosticSeverity.Error;
              break;
            case 'warning':
              severity = vscode.DiagnosticSeverity.Warning;
              break;
            case 'information':
              severity = vscode.DiagnosticSeverity.Information;
              break;
            case 'hint':
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

  getEnabledRules(): Rule[] {
    return Array.from(this.rules.values()).filter((rule) => rule.isEnabled());
  }

  getRuleById(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }
}
