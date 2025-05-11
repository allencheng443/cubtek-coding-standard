import * as cp from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { RuleRegistry } from "../rules/ruleRegistry";
import { ConfigManager } from "../utils/config";

/**
 * Performs code quality checks on C/C++ files using clang-tidy and custom rules.
 *
 * This class combines industry standard static analysis with CubTEK-specific
 * rule checks to provide comprehensive diagnostics for code quality.
 */
export class CubtekChecker {
  /** Registry of all available checking rules. */
  private ruleRegistry: RuleRegistry;

  /**
   * Creates a new CubtekChecker instance.
   *
   * @param configManager Configuration manager controlling rule settings and options.
   */
  constructor(private readonly configManager: ConfigManager) {
    this.ruleRegistry = new RuleRegistry(configManager);
  }

  /**
   * Checks a document for code quality issues.
   *
   * Combines clang-tidy analysis with custom rules to identify potential problems.
   * Only processes C/C++ files and silently returns empty array for other file types.
   *
   * @param document Document to analyze for code quality issues.
   * @returns Promise resolving to array of diagnostic issues found in the document.
   */
  async checkDocument(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    if (document.languageId !== "c" && document.languageId !== "cpp") {
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
        error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Checker error: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Runs clang-tidy on the document to find standard C/C++ issues.
   *
   * Creates a temporary file for clang-tidy processing and parses its output.
   *
   * @param document Document to check with clang-tidy.
   * @return Promise resolving to diagnostics from clang-tidy.
   * @throws Error if clang-tidy isn't installed or fails during execution.
   * @private
   */
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
        const args = [tempFile, "-quiet", "--export-fixes=/dev/null"];

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
          document.uri
        )?.uri.fsPath;
        if (workspaceFolder) {
          // Look for .clang-tidy in workspace
          const clangTidyPath = path.join(workspaceFolder, ".clang-tidy");
          if (fs.existsSync(clangTidyPath)) {
            args.push(`--config-file=${clangTidyPath}`);
          }
        }

        const tidyProcess = cp.spawn("clang-tidy", args);
        let stdout = "";
        let stderr = "";

        tidyProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        tidyProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        tidyProcess.on("close", (code) => {
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

        tidyProcess.on("error", (err) => {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }

          if (err.message.includes("ENOENT")) {
            reject(
              new Error("clang-tidy not found. Please install clang-tidy.")
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

  /**
   * Converts clang-tidy output to VSCode diagnostic objects.
   *
   * Parses the text output to extract file locations, severity levels,
   * messages, and rule identifiers.
   *
   * @param output String output from the clang-tidy process.
   * @param document Document being checked.
   * @return Array of diagnostics created from the clang-tidy output.
   * @private
   */
  private parseClangTidyOutput(
    output: string,
    document: vscode.TextDocument
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = output.split("\n");

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
        if (levelStr === "error") {
          severity = vscode.DiagnosticSeverity.Error;
        } else if (levelStr === "warning") {
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

        diagnostic.source = "CubTEK (clang-tidy)";
        diagnostic.code = ruleId;

        diagnostics.push(diagnostic);
      } catch (error) {
        // Skip problematic lines but continue processing others
        console.error(`Error parsing clang-tidy output line: ${line}`, error);
      }
    }

    return diagnostics;
  }

  /**
   * Executes all enabled custom rule checks on the document.
   *
   * Each rule runs independently to isolate failures and prevent one rule
   * from blocking others.
   *
   * @param document Document to check with custom rules.
   * @return Promise resolving to array of diagnostics from custom rules.
   * @private
   */
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
