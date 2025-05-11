/**
 * Module for formatting C/C++ code using clang-format.
 */
import * as cp from "child_process";
import * as vscode from "vscode";
import { ConfigManager } from "../utils/config";

/**
 * Provides C/C++ code formatting functionality using the clang-format tool.
 * Implements VSCode's DocumentFormattingEditProvider interface.
 */
export class CubtekFormatter implements vscode.DocumentFormattingEditProvider {
  /**
   * Creates a new formatter instance.
   *
   * @param configManager Configuration manager that provides formatting settings.
   */
  constructor(private readonly configManager: ConfigManager) {}

  /**
   * Formats the entire document according to CubTEK's C/C++ coding standards.
   * Only processes C and C++ files, returns empty array for other file types.
   *
   * @param document The document to format.
   * @returns A promise that resolves to an array of text edits to apply.
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
   * Formats a document by executing clang-format as an external process.
   *
   * The method writes the document content to the clang-format process stdin,
   * then captures and returns the formatted output from stdout.
   *
   * @param document The document to format.
   * @returns A promise that resolves to the formatted text.
   * @throws {Error} If clang-format is not installed or returns an error.
   * @private
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

        // Capture standard output from the clang-format process
        formatProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        // Capture standard error from the clang-format process
        formatProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        // Handle process completion
        formatProcess.on("close", (code) => {
          if (code !== 0) {
            reject(
              new Error(`clang-format exited with code ${code}: ${stderr}`)
            );
            return;
          }

          resolve(stdout);
        });

        // Handle process errors (e.g., if clang-format is not installed)
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
