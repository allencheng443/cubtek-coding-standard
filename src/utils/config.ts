// src/utils/config.ts
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface CubtekConfig {
  formatOnSave: boolean;
  checkOnSave: boolean;
  severity: 'error' | 'warning' | 'information' | 'hint';
  configPath: string;
  rules: Record<string, RuleConfig>;
}

export interface RuleConfig {
  enabled: boolean;
  severity?: 'error' | 'warning' | 'information' | 'hint';
  params?: Record<string, any>;
}

export class ConfigManager {
  private config: CubtekConfig;
  private readonly defaultRules: Record<string, RuleConfig> = {
    'CUBTEK-FUNC-001': {
      enabled: true,
      severity: 'warning',
      params: { maxLines: 50 },
    },
    'CUBTEK-NAME-001': {
      enabled: true,
      severity: 'warning',
    },
    // Add more default rules here
  };

  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize with default configuration
    this.config = {
      formatOnSave: true,
      checkOnSave: true,
      severity: 'warning',
      configPath: '',
      rules: { ...this.defaultRules },
    };
  }

  async initialize(): Promise<void> {
    // Load VSCode settings
    this.loadVSCodeSettings();

    // Try to load project-specific configuration
    await this.loadProjectConfig();
  }

  private loadVSCodeSettings(): void {
    const vsconfig = vscode.workspace.getConfiguration('cubtek');

    this.config.formatOnSave = vsconfig.get('formatOnSave', true);
    this.config.checkOnSave = vsconfig.get('checkOnSave', true);
    this.config.severity = vsconfig.get('severity', 'warning') as any;
    this.config.configPath = vsconfig.get('configPath', '');
  }

  private async loadProjectConfig(): Promise<void> {
    try {
      let configPath = this.config.configPath;

      // If no config path specified, look for default locations
      if (!configPath) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const rootPath = workspaceFolders[0].uri.fsPath;
          const defaultPaths = [
            path.join(rootPath, '.cubtek.json'),
            path.join(rootPath, '.vscode', 'cubtek-config.json'),
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
        const fileContent = fs.readFileSync(configPath, 'utf8');
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

  private async extractDefaultConfigs(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const vscodePath = path.join(rootPath, '.vscode');

    // Create .vscode directory if it doesn't exist
    if (!fs.existsSync(vscodePath)) {
      fs.mkdirSync(vscodePath, { recursive: true });
    }

    // Extract default clang-format and clang-tidy configs
    const configsToExtract = [
      {
        source: path.join(
          this.context.extensionPath,
          'configs',
          '.clang-format'
        ),
        target: path.join(rootPath, '.clang-format'),
      },
      {
        source: path.join(this.context.extensionPath, 'configs', '.clang-tidy'),
        target: path.join(rootPath, '.clang-tidy'),
      },
      {
        source: path.join(
          this.context.extensionPath,
          'configs',
          'cubtek-config.json'
        ),
        target: path.join(vscodePath, 'cubtek-config.json'),
      },
    ];

    for (const config of configsToExtract) {
      if (fs.existsSync(config.source) && !fs.existsSync(config.target)) {
        fs.copyFileSync(config.source, config.target);
      }
    }
  }

  getConfig(): CubtekConfig {
    return this.config;
  }

  getRuleConfig(ruleId: string): RuleConfig | undefined {
    return this.config.rules[ruleId];
  }

  async updateConfig(newConfig: Partial<CubtekConfig>): Promise<void> {
    // Update in-memory config
    this.config = { ...this.config, ...newConfig };

    // Save to workspace settings if needed
    // ...
  }
}
