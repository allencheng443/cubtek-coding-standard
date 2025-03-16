/**
 * Formatter module for C/C++ code using clang-format
 * @module formatter
 */
import * as cp from "child_process";
import * as vscode from "vscode";
import { ConfigManager } from "../utils/config";

/**
 * Implements C/C++ code formatting functionality for the Cubtek VSCode extension
 * using the clang-format tool
 * @implements {vscode.DocumentFormattingEditProvider}
 */
export class CubtekFormatter implements vscode.DocumentFormattingEditProvider {
  /**
   * Creates a new instance of the CubtekFormatter
   * @param {ConfigManager} configManager - Configuration manager for the extension
   */
  constructor(private readonly configManager: ConfigManager) {}

  /**
   * Provides document formatting edits for C/C++ files
   * @param {vscode.TextDocument} document - The document to format
   * @returns {Promise<vscode.TextEdit[]>} Array of text edits to apply to the document
   */
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    // Only format C/C++ files
    if (document.languageId !== "c" && document.languageId !== "cpp") {
      return [];
    }

    try {
      const formatted = await this.formatDocument(document);

      if (formatted === document.getText()) {
        // No changes needed
        return [];
      }

      return [
        vscode.TextEdit.replace(
          new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          ),
          formatted
        ),
      ];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Format error: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Formats a document using clang-format
   * @private
   * @param {vscode.TextDocument} document - The document to format
   * @returns {Promise<string>} The formatted document text
   * @throws {Error} Throws an error if clang-format fails or is not found
   */
  private async formatDocument(document: vscode.TextDocument): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        // Find clang-format configuration
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
          document.uri
        )?.uri.fsPath;

        // Define clang-format arguments
        const args = [
          "-style=file", // Use .clang-format file if available
          "-assume-filename=" + document.fileName,
        ];

        // Spawn clang-format process
        const formatProcess = cp.spawn("clang-format", args);
        let stdout = "";
        let stderr = "";

        /**
         * Capture standard output from the clang-format process
         */
        formatProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        /**
         * Capture standard error from the clang-format process
         */
        formatProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        /**
         * Handle process completion
         */
        formatProcess.on("close", (code) => {
          if (code !== 0) {
            reject(
              new Error(`clang-format exited with code ${code}: ${stderr}`)
            );
            return;
          }

          resolve(stdout);
        });

        /**
         * Handle process errors (e.g., if clang-format is not installed)
         */
        formatProcess.on("error", (err) => {
          if (err.message.includes("ENOENT")) {
            reject(
              new Error("clang-format not found. Please install clang-format.")
            );
          } else {
            reject(err);
          }
        });

        // Write document content to stdin
        formatProcess.stdin.write(document.getText());
        formatProcess.stdin.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
