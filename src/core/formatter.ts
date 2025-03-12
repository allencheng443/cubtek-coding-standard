// src/core/formatter.ts
import * as cp from 'child_process';
import * as vscode from 'vscode';
import { ConfigManager } from '../utils/config';

export class CubtekFormatter implements vscode.DocumentFormattingEditProvider {
  constructor(private readonly configManager: ConfigManager) {}

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Promise<vscode.TextEdit[]> {
    // Only format C/C++ files
    if (document.languageId !== 'c' && document.languageId !== 'cpp') {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Format error: ${errorMessage}`);
      return [];
    }
  }

  private async formatDocument(document: vscode.TextDocument): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        // Find clang-format configuration
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
          document.uri
        )?.uri.fsPath;

        // Define clang-format arguments
        const args = [
          '-style=file', // Use .clang-format file if available
          '-assume-filename=' + document.fileName,
        ];

        // Spawn clang-format process
        const formatProcess = cp.spawn('clang-format', args);
        let stdout = '';
        let stderr = '';

        formatProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        formatProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        formatProcess.on('close', (code) => {
          if (code !== 0) {
            reject(
              new Error(`clang-format exited with code ${code}: ${stderr}`)
            );
            return;
          }

          resolve(stdout);
        });

        formatProcess.on('error', (err) => {
          if (err.message.includes('ENOENT')) {
            reject(
              new Error('clang-format not found. Please install clang-format.')
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
