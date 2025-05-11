/**
 * @fileoverview Configuration management for the CubTEK extension.
 * Handles loading, parsing, and maintaining configuration settings from various sources.
 */
import { CubtekConfig, RuleConfig } from "@/types";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

/**
 * Manages the configuration for the CubTEK extension.
 * Handles loading settings from VS Code configuration and project-specific config files.
 */
export class ConfigManager {
  /** Current active configuration. */
  private config: CubtekConfig;

  /**
   * Default rule configurations that apply when no overrides are present.
   * @private
   */
  private readonly defaultRules: Record<string, RuleConfig> = {
    "CUBTEK-FUNC-001": {
      enabled: true,
      severity: "warning",
      params: { maxLines: 50 },
    },
    "CUBTEK-NAME-001": {
      enabled: true,
      severity: "warning",
    },
    // Add more default rules here
  };

  /**
   * Creates a new ConfigManager instance.
   * @param context The VS Code extension context.
   */
  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize with default configuration
    this.config = {
      formatOnSave: true,
      checkOnSave: true,
      severity: "warning",
      configPath: "",
      rules: { ...this.defaultRules },
    };
  }

  /**
   * Initializes the configuration by loading settings from VS Code
   * and project-specific configuration files.
   * @return Promise that resolves when configuration is fully loaded.
   */
  async initialize(): Promise<void> {
    // Load VSCode settings
    this.loadVSCodeSettings();

    // Try to load project-specific configuration
    await this.loadProjectConfig();
  }

  /**
   * Loads configuration settings from VS Code's configuration.
   * @private
   */
  private loadVSCodeSettings(): void {
    const vsconfig = vscode.workspace.getConfiguration("cubtek");

    this.config.formatOnSave = vsconfig.get("formatOnSave", true);
    this.config.checkOnSave = vsconfig.get("checkOnSave", true);
    this.config.severity = vsconfig.get("severity", "warning") as any;
    this.config.configPath = vsconfig.get("configPath", "");
  }

  /**
   * Loads project-specific configuration from a configuration file.
   * If no configuration file exists, extracts default configurations to the workspace.
   * @private
   * @return Promise that resolves when project configuration is loaded.
   */
  private async loadProjectConfig(): Promise<void> {
    try {
      let configPath = this.config.configPath;

      // If no config path specified, look for default locations
      if (!configPath) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const rootPath = workspaceFolders[0].uri.fsPath;
          const defaultPaths = [
            path.join(rootPath, ".cubtek.json"),
            path.join(rootPath, ".vscode", "cubtek-config.json"),
          ];

          for (const p of defaultPaths) {
            if (fs.existsSync(p)) {
              configPath = p;
              break;
            }
          }
        }
      }

      // Load config file if found
      if (configPath && fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf8");
        const projectConfig = JSON.parse(fileContent);

        // Merge with defaults
        if (projectConfig.rules) {
          this.config.rules = { ...this.defaultRules, ...projectConfig.rules };
        }

        // Override other settings if specified
        if (projectConfig.formatOnSave !== undefined) {
          this.config.formatOnSave = projectConfig.formatOnSave;
        }
        if (projectConfig.checkOnSave !== undefined) {
          this.config.checkOnSave = projectConfig.checkOnSave;
        }
        if (projectConfig.severity) {
          this.config.severity = projectConfig.severity;
        }
      } else {
        // If no config found, extract default configs to workspace
        await this.extractDefaultConfigs();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(
        `Error loading CubTEK configuration: ${errorMessage}`
      );
    }
  }

  /**
   * Extracts default configuration files to the workspace.
   * Creates necessary directories and copies configuration templates from extension resources.
   * @private
   * @return Promise that resolves when extraction completes.
   */
  private async extractDefaultConfigs(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const vscodePath = path.join(rootPath, ".vscode");

    // Create .vscode directory if it doesn't exist
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath, { recursive: true });
    }

    // Extract default clang-format and clang-tidy configs
    const configsToExtract = [
      {
        source: path.join(
          this.context.extensionPath,
          "configs",
          ".clang-format"
        ),
        target: path.join(rootPath, ".clang-format"),
      },
      {
        source: path.join(this.context.extensionPath, "configs", ".clang-tidy"),
        target: path.join(rootPath, ".clang-tidy"),
      },
      {
        source: path.join(
          this.context.extensionPath,
          "configs",
          "cubtek-config.json"
        ),
        target: path.join(vscodePath, "cubtek-config.json"),
      },
    ];

    for (const config of configsToExtract) {
      if (fs.existsSync(config.source) && !fs.existsSync(config.target)) {
        fs.copyFileSync(config.source, config.target);
      }
    }
  }

  /**
   * Returns the current configuration.
   * @return The current CubTEK configuration.
   */
  getConfig(): CubtekConfig {
    return this.config;
  }

  /**
   * Gets the configuration for a specific rule.
   * @param ruleId The ID of the rule to retrieve.
   * @return The rule configuration or undefined if the rule doesn't exist.
   */
  getRuleConfig(ruleId: string): RuleConfig | undefined {
    return this.config.rules[ruleId];
  }

  /**
   * Updates the current configuration with new values.
   * @param newConfig Partial configuration with values to update.
   * @return Promise that resolves when the update is complete.
   */
  async updateConfig(newConfig: Partial<CubtekConfig>): Promise<void> {
    // Update in-memory config
    this.config = { ...this.config, ...newConfig };

    // Save to workspace settings if needed
    // ...
  }
}
