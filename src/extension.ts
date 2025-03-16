/**
 * CubTEK Coding Standard Extension
 *
 * This extension provides C/C++ code checking and formatting according to
 * CubTEK coding standards, including diagnostics, quick fixes, and formatting.
 */
import * as vscode from "vscode";
import { CubtekChecker } from "./core/checker";
import { CubtekFormatter } from "./core/formatter";
import { CubtekQuickFixProvider } from "./core/quickFix";
import { ConfigManager } from "./utils/config";

/**
 * Activates the CubTEK Coding Standard extension.
 * This function is called when the extension is activated,
 * and sets up all functionality, including formatters, checkers,
 * diagnostic collections, and command registrations.
 *
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code
 * @returns {Promise<void>} A promise that resolves when activation is complete
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log("CubTEK Coding Standard extension is now active");

  // Initialize configuration manager
  const configManager = new ConfigManager(context);
  await configManager.initialize();

  // Initialize formatter
  const formatter = new CubtekFormatter(configManager);

  /**
   * Register formatter for C/C++ files.
   * This enables code formatting according to CubTEK standards.
   */
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      [{ language: "c" }, { language: "cpp" }],
      formatter
    )
  );

  // Initialize checker and diagnostics collection
  const checker = new CubtekChecker(configManager);
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("cubtek");
  context.subscriptions.push(diagnosticCollection);

  /**
   * Register quick fix provider for C/C++ files.
   * This allows the extension to provide automated fixes for code issues.
   */
  const quickFixProvider = new CubtekQuickFixProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [{ language: "c" }, { language: "cpp" }],
      quickFixProvider,
      {
        providedCodeActionKinds: CubtekQuickFixProvider.providedCodeActionKinds,
      }
    )
  );

  /**
   * Analyzes a document and reports any coding standard violations.
   *
   * @param {vscode.TextDocument} document - The document to check
   * @returns {Promise<void>} A promise that resolves when checking is complete
   */
  const checkFile = async (document: vscode.TextDocument) => {
    if (
      (document.languageId === "c" || document.languageId === "cpp") &&
      configManager.getConfig().checkOnSave
    ) {
      const diagnostics = await checker.checkDocument(document);
      diagnosticCollection.set(document.uri, diagnostics);
    }
  };

  /**
   * Register event handlers for document changes and saves.
   * This ensures files are checked when opened or saved.
   */
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(checkFile),
    vscode.workspace.onDidOpenTextDocument(checkFile)
  );

  // Check all open documents on startup
  vscode.workspace.textDocuments.forEach(checkFile);

  /**
   * Register format on save handler.
   * This automatically formats C/C++ files when they are saved if enabled in settings.
   */
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (
        (event.document.languageId === "c" ||
          event.document.languageId === "cpp") &&
        configManager.getConfig().formatOnSave
      ) {
        event.waitUntil(
          vscode.commands.executeCommand("editor.action.formatDocument")
        );
      }
    })
  );

  /**
   * Register command to manually check the current file.
   * This allows users to trigger a check from the command palette.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("cubtek.checkFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await checkFile(editor.document);
        vscode.window.showInformationMessage("CubTEK: File checked");
      }
    })
  );

  /**
   * Register command to check all C/C++ files in the workspace.
   * This performs a bulk check of the entire project with progress indication.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("cubtek.checkProject", async () => {
      // Find all C/C++ files in the workspace and check them
      const files = await vscode.workspace.findFiles("**/*.{c,cpp,h,hpp}");

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Checking project for coding standards",
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

  /**
   * Register command to show a report of coding standard violations.
   * This feature is planned for future implementation.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("cubtek.showReport", () => {
      // To be implemented: Generate and show report
      vscode.window.showInformationMessage(
        "CubTEK: Report feature coming soon"
      );
    })
  );
}

/**
 * Deactivates the extension.
 * This function is called when the extension is deactivated,
 * providing an opportunity to clean up resources.
 */
export function deactivate() {
  // Clean up resources if needed
}
