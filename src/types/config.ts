/**
 * Configuration interface for the CubTEK extension.
 *
 * Controls formatting behavior, rule enforcement, and severity levels
 * throughout the extension.
 *
 * @since 1.0.0
 * @example
 * const config = {
 *   formatOnSave: true,
 *   checkOnSave: true,
 *   severity: "warning",
 *   configPath: "./.cubtek/config.json",
 *   rules: {
 *     "CUBTEK-NAME-001": {
 *       enabled: true,
 *       severity: "error"
 *     }
 *   }
 * };
 */
export interface CubtekConfig {
  /**
   * Controls whether code formatting is automatically applied when files are saved.
   */
  formatOnSave: boolean;

  /**
   * Controls whether code checking is automatically performed when files are saved.
   */
  checkOnSave: boolean;

  /**
   * Default severity level for rule violations throughout the project.
   * Can be overridden by individual rule configurations.
   */
  severity: "error" | "warning" | "information" | "hint";

  /**
   * Path to the project-specific configuration file.
   * Contains project-level overrides for the extension settings.
   */
  configPath: string;

  /**
   * Map of rule IDs to their specific configurations.
   * Allows for fine-grained control over individual rule behavior.
   */
  rules: Record<string, RuleConfig>;
}

/**
 * Configuration for an individual CubTEK rule.
 *
 * Defines how a specific rule should behave, including activation status,
 * reporting severity, and custom parameters.
 *
 * @since 1.0.0
 * @example
 * const functionLengthRule = {
 *   enabled: true,
 *   severity: "warning",
 *   params: {
 *     maxLines: 100,
 *     ignoreComments: true
 *   }
 * };
 */
export interface RuleConfig {
  /**
   * Determines if the rule is active and should be enforced.
   */
  enabled: boolean;

  /**
   * Optional severity level for this specific rule.
   * Overrides the global severity setting when specified.
   */
  severity?: "error" | "warning" | "information" | "hint";

  /**
   * Optional parameters for rule customization.
   * The schema depends on the specific rule implementation.
   */
  params?: Record<string, any>;
}
