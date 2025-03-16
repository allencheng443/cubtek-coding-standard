/**
 * @fileoverview Provides quick fix capabilities for CubTEK diagnostics within VS Code.
 * This module implements code actions for various CubTEK-specific issues.
 */
import * as vscode from "vscode";

/**
 * Provider class that implements quick fixes for CubTEK diagnostics.
 * This class analyzes diagnostics from CubTEK and clang-tidy sources and
 * provides appropriate code actions to fix detected issues.
 */
export class CubtekQuickFixProvider implements vscode.CodeActionProvider {
  /**
   * List of code action kinds this provider can handle.
   * Currently only supports QuickFix actions.
   */
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  /**
   * Provides code actions for diagnostics in the given context.
   * This method filters diagnostics to only handle CubTEK-related issues
   * and creates specific code actions based on the diagnostic code.
   *
   * @param document - The document in which the command was invoked
   * @param range - The selected range or current position in the document
   * @param context - The context containing relevant diagnostics
   * @param token - A cancellation token to signal if the request is cancelled
   * @returns An array of code actions or commands, or a promise thereof
   */
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    // Filter diagnostics to only include CubTEK diagnostics
    const cubtekDiagnostics = context.diagnostics.filter(
      (diag) =>
        diag.source === "CubTEK" || diag.source === "CubTEK (clang-tidy)"
    );

    if (!cubtekDiagnostics.length) {
      return [];
    }

    const actions: vscode.CodeAction[] = [];

    // Process each diagnostic and provide appropriate fix actions
    for (const diagnostic of cubtekDiagnostics) {
      if (!diagnostic.code) {
        continue;
      }
      const codeActionTitle = `Fix ${diagnostic.code}`;

      switch (diagnostic.code.toString()) {
        case "CUBTEK-FUNC-001":
          actions.push(
            this.createFunctionLengthFixAction(document, range, diagnostic)
          );
          break;

        case "CUBTEK-NAME-001":
          actions.push(
            this.createNamingConventionFixAction(document, range, diagnostic)
          );
          break;

        // More rule-specific fixes

        // Generic clang-tidy fixes
        default:
          if (diagnostic.source === "CubTEK (clang-tidy)") {
            actions.push(
              this.createGenericFixAction(document, range, diagnostic)
            );
          }
          break;
      }
    }

    return actions;
  }

  /**
   * Creates a code action to fix function length issues (CUBTEK-FUNC-001).
   * This action suggests extracting part of the function to reduce its length,
   * using the built-in refactoring tools in the editor.
   *
   * @param document - The document containing the function to refactor
   * @param range - The range of text covered by the diagnostic
   * @param diagnostic - The diagnostic describing the function length issue
   * @returns A code action that triggers the extract function refactoring
   */
  private createFunctionLengthFixAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Extract part of function to reduce length",
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      title: "Extract Function",
      command: "editor.action.refactor.extract",
      arguments: [],
    };

    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
  }

  /**
   * Creates a code action to fix naming convention issues (CUBTEK-NAME-001).
   * This action automatically renames variables according to the project's
   * naming conventions, applying the appropriate prefix or casing.
   *
   * @param document - The document containing the variable to rename
   * @param range - The range of text covered by the diagnostic
   * @param diagnostic - The diagnostic describing the naming convention issue
   * @returns A code action with a workspace edit to rename the variable
   */
  private createNamingConventionFixAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Fix variable naming",
      vscode.CodeActionKind.QuickFix
    );

    // Extract the variable name from the diagnostic range
    const varName = document.getText(diagnostic.range);

    // Determine the correct prefix based on the diagnostic message
    let fixedName = varName;

    if (diagnostic.message.includes("global variable")) {
      fixedName = `g_${varName.replace(/^g_/, "")}`;
    } else if (diagnostic.message.includes("static variable")) {
      fixedName = `s_${varName.replace(/^s_/, "")}`;
    } else if (diagnostic.message.includes("parameter")) {
      fixedName = `${varName.charAt(0).toLowerCase()}${varName.slice(1)}`;
    }

    // Create a workspace edit to replace the name
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, diagnostic.range, fixedName);

    action.edit = edit;
    action.diagnostics = [diagnostic];

    return action;
  }

  /**
   * Creates a generic code action for clang-tidy related issues.
   * This action provides a link to the official documentation for the specific
   * clang-tidy check that was violated.
   *
   * @param document - The document containing the issue
   * @param range - The range of text covered by the diagnostic
   * @param diagnostic - The diagnostic from clang-tidy
   * @returns A code action that opens the relevant documentation in a browser
   */
  private createGenericFixAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `View documentation for ${diagnostic.code}`,
      vscode.CodeActionKind.QuickFix
    );

    // For general clang-tidy issues, just show some help for now
    // In a real implementation, this could provide more specific fixes
    action.command = {
      title: "Show Documentation",
      command: "vscode.open",
      arguments: [
        vscode.Uri.parse(
          `https://clang.llvm.org/extra/clang-tidy/checks/${diagnostic.code}.html`
        ),
      ],
    };

    action.diagnostics = [diagnostic];

    return action;
  }
}
