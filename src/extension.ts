// src/extension.ts
import * as vscode from 'vscode';
import { CubtekChecker } from './core/checker';
import { CubtekFormatter } from './core/formatter';
import { CubtekQuickFixProvider } from './core/quickFix';
import { ConfigManager } from './utils/config';

export async function activate(context: vscode.ExtensionContext) {
  console.log('CubTEK Coding Standard extension is now active');

  // Initialize configuration manager
  const configManager = new ConfigManager(context);
  await configManager.initialize();

  // Initialize formatter
  const formatter = new CubtekFormatter(configManager);

  // Register formatter for C/C++ files
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      [{ language: 'c' }, { language: 'cpp' }],
      formatter
    )
  );

  // Initialize checker and diagnostics collection
  const checker = new CubtekChecker(configManager);
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection('cubtek');
  context.subscriptions.push(diagnosticCollection);

  // Register quick fix provider
  const quickFixProvider = new CubtekQuickFixProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [{ language: 'c' }, { language: 'cpp' }],
      quickFixProvider,
      {
        providedCodeActionKinds: CubtekQuickFixProvider.providedCodeActionKinds,
      }
    )
  );

  // Check current file
  const checkFile = async (document: vscode.TextDocument) => {
    if (
      (document.languageId === 'c' || document.languageId === 'cpp') &&
      configManager.getConfig().checkOnSave
    ) {
      const diagnostics = await checker.checkDocument(document);
      diagnosticCollection.set(document.uri, diagnostics);
    }
  };

  // Register file change and save handlers
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(checkFile),
    vscode.workspace.onDidOpenTextDocument(checkFile)
  );

  // Check all open documents on startup
  vscode.workspace.textDocuments.forEach(checkFile);

  // Register format on save handler
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (
        (event.document.languageId === 'c' ||
          event.document.languageId === 'cpp') &&
        configManager.getConfig().formatOnSave
      ) {
        event.waitUntil(
          vscode.commands.executeCommand('editor.action.formatDocument')
        );
      }
    })
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cubtek.checkFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await checkFile(editor.document);
        vscode.window.showInformationMessage('CubTEK: File checked');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cubtek.checkProject', async () => {
      // Find all C/C++ files in the workspace and check them
      const files = await vscode.workspace.findFiles('**/*.{c,cpp,h,hpp}');

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Checking project for coding standards',
          cancellable: true,
        },
        async (progress, token) => {
          let checked = 0;
          const total = files.length;

          for (const file of files) {
            if (token.isCancellationRequested) {
              break;
            }

            const document = await vscode.workspace.openTextDocument(file);
            const diagnostics = await checker.checkDocument(document);
            diagnosticCollection.set(file, diagnostics);

            checked++;
            progress.report({
              increment: 100 * (1 / total),
              message: `${checked}/${total} files`,
            });
          }

          vscode.window.showInformationMessage(
            `CubTEK: Project checked (${checked} files)`
          );
        }
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('cubtek.showReport', () => {
      // To be implemented: Generate and show report
      vscode.window.showInformationMessage(
        'CubTEK: Report feature coming soon'
      );
    })
  );
}

export function deactivate() {
  // Clean up resources if needed
}
