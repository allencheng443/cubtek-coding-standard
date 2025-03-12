// src/core/checker.ts
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { RuleRegistry } from '../rules/ruleRegistry';
import { ConfigManager } from '../utils/config';

export class CubtekChecker {
  private ruleRegistry: RuleRegistry;

  constructor(private readonly configManager: ConfigManager) {
    this.ruleRegistry = new RuleRegistry(configManager);
  }

  async checkDocument(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    if (document.languageId !== 'c' && document.languageId !== 'cpp') {
      return [];
    }

    try {
      const diagnostics: vscode.Diagnostic[] = [];

      // First run clang-tidy for general C/C++ issues
      const clangTidyDiagnostics = await this.runClangTidy(document);
      diagnostics.push(...clangTidyDiagnostics);

      // Then run custom rule checks
      const customRuleDiagnostics = await this.runCustomRuleChecks(document);
      diagnostics.push(...customRuleDiagnostics);

      return diagnostics;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Checker error: ${errorMessage}`);
      return [];
    }
  }

  private async runClangTidy(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    return new Promise<vscode.Diagnostic[]>(async (resolve, reject) => {
      try {
        // Create a temporary file for clang-tidy to work with
        const tempFile = path.join(
          os.tmpdir(),
          `cubtek_${Date.now()}_${path.basename(document.fileName)}`
        );
        fs.writeFileSync(tempFile, document.getText());

        // Run clang-tidy
        const args = [tempFile, '-quiet', '--export-fixes=/dev/null'];

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
          document.uri
        )?.uri.fsPath;
        if (workspaceFolder) {
          // Look for .clang-tidy in workspace
          const clangTidyPath = path.join(workspaceFolder, '.clang-tidy');
          if (fs.existsSync(clangTidyPath)) {
            args.push(`--config-file=${clangTidyPath}`);
          }
        }

        const tidyProcess = cp.spawn('clang-tidy', args);
        let stdout = '';
        let stderr = '';

        tidyProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        tidyProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        tidyProcess.on('close', (code) => {
          try {
            // Delete temp file
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }

            const diagnostics = this.parseClangTidyOutput(stdout, document);
            resolve(diagnostics);
          } catch (error) {
            reject(error);
          }
        });

        tidyProcess.on('error', (err) => {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }

          if (err.message.includes('ENOENT')) {
            reject(
              new Error('clang-tidy not found. Please install clang-tidy.')
            );
          } else {
            reject(err);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private parseClangTidyOutput(
    output: string,
    document: vscode.TextDocument
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = output.split('\n');

    // Pattern to match clang-tidy output lines
    // Example: /path/to/file.c:10:5: warning: some message [rule-name]
    const pattern = /(.+):(\d+):(\d+):\s+(warning|error):\s+(.+?)\s+\[(.+)\]/;

    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) {
        continue;
      }

      try {
        // Extract information from match
        const [_, filePath, lineStr, colStr, levelStr, message, ruleId] = match;

        // Convert to 0-based indices for VSCode
        const lineNum = parseInt(lineStr) - 1;
        const colNum = parseInt(colStr) - 1;

        // Create diagnostic range
        const range = new vscode.Range(
          new vscode.Position(lineNum, colNum),
          new vscode.Position(lineNum, document.lineAt(lineNum).text.length)
        );

        // Determine severity
        let severity: vscode.DiagnosticSeverity;
        if (levelStr === 'error') {
          severity = vscode.DiagnosticSeverity.Error;
        } else if (levelStr === 'warning') {
          severity = vscode.DiagnosticSeverity.Warning;
        } else {
          severity = vscode.DiagnosticSeverity.Information;
        }

        // Create and add the diagnostic
        const diagnostic = new vscode.Diagnostic(
          range,
          `${message} [${ruleId}]`,
          severity
        );

        diagnostic.source = 'CubTEK (clang-tidy)';
        diagnostic.code = ruleId;

        diagnostics.push(diagnostic);
      } catch (error) {
        // Skip problematic lines but continue processing others
        console.error(`Error parsing clang-tidy output line: ${line}`, error);
      }
    }

    return diagnostics;
  }

  private async runCustomRuleChecks(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    // Get all enabled rules
    const rules = this.ruleRegistry.getEnabledRules();

    // Run each rule
    for (const rule of rules) {
      try {
        const ruleDiagnostics = await rule.check(document);
        diagnostics.push(...ruleDiagnostics);
      } catch (error) {
        console.error(`Error running rule ${rule.getId()}:`, error);
      }
    }

    return diagnostics;
  }
}
