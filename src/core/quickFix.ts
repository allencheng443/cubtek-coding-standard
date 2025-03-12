// src/core/quickFix.ts
import * as vscode from 'vscode';

export class CubtekQuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    // Filter diagnostics to only include CubTEK diagnostics
    const cubtekDiagnostics = context.diagnostics.filter(
      (diag) =>
        diag.source === 'CubTEK' || diag.source === 'CubTEK (clang-tidy)'
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
        case 'CUBTEK-FUNC-001':
          actions.push(
            this.createFunctionLengthFixAction(document, range, diagnostic)
          );
          break;

        case 'CUBTEK-NAME-001':
          actions.push(
            this.createNamingConventionFixAction(document, range, diagnostic)
          );
          break;

        // More rule-specific fixes

        // Generic clang-tidy fixes
        default:
          if (diagnostic.source === 'CubTEK (clang-tidy)') {
            actions.push(
              this.createGenericFixAction(document, range, diagnostic)
            );
          }
          break;
      }
    }

    return actions;
  }

  private createFunctionLengthFixAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Extract part of function to reduce length',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      title: 'Extract Function',
      command: 'editor.action.refactor.extract',
      arguments: [],
    };

    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
  }

  private createNamingConventionFixAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      'Fix variable naming',
      vscode.CodeActionKind.QuickFix
    );

    // Extract the variable name from the diagnostic range
    const varName = document.getText(diagnostic.range);

    // Determine the correct prefix based on the diagnostic message
    let fixedName = varName;

    if (diagnostic.message.includes('global variable')) {
      fixedName = `g_${varName.replace(/^g_/, '')}`;
    } else if (diagnostic.message.includes('static variable')) {
      fixedName = `s_${varName.replace(/^s_/, '')}`;
    } else if (diagnostic.message.includes('parameter')) {
      fixedName = `${varName.charAt(0).toLowerCase()}${varName.slice(1)}`;
    }

    // Create a workspace edit to replace the name
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, diagnostic.range, fixedName);

    action.edit = edit;
    action.diagnostics = [diagnostic];

    return action;
  }

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
      title: 'Show Documentation',
      command: 'vscode.open',
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
