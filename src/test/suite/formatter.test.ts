import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CubtekFormatter } from '../../core/formatter';
import { ConfigManager } from '../../utils/config';

suite('Formatter Test Suite', () => {
  let formatter: CubtekFormatter;
  let configManager: ConfigManager;

  suiteSetup(async () => {
    // Create config manager with mock context
    const context = {
      extensionPath: path.join(__dirname, '../../../'),
      globalStoragePath: path.join(__dirname, '../../../test-data'),
      subscriptions: [],
      workspaceState: { get: () => {}, update: () => {} },
      globalState: { get: () => {}, update: () => {} },
    } as unknown as vscode.ExtensionContext;

    configManager = new ConfigManager(context);
    await configManager.initialize();
    formatter = new CubtekFormatter(configManager);
  });

  test('Format C Document', async function () {
    this.timeout(10000); // Format might take time

    // Create test document
    const testFilePath = path.join(__dirname, '../../../test-data/test.c');
    const content = 'void testFunction() { int x=5;if(x>3){x=4;} }';
    fs.writeFileSync(testFilePath, content);

    const uri = vscode.Uri.file(testFilePath);
    const document = await vscode.workspace.openTextDocument(uri);

    // Format document
    const edits = await formatter.provideDocumentFormattingEdits(document);

    // Check results
    assert.strictEqual(edits.length, 1);
    const formattedText = edits[0].newText;

    // Verify indentation and braces
    assert.ok(formattedText.includes('{\n    int'));
    assert.ok(formattedText.includes('if (x > 3)\n    {'));
  });
});
