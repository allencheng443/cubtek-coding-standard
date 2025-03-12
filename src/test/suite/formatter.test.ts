import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CubtekFormatter } from '../../core/formatter';
import { ConfigManager } from '../../utils/config';

// 修改 clang-format 配置
const clangFormatConfig = `---
Language: Cpp
IndentWidth: 4
UseTab: Never
BreakBeforeBraces: Allman     # 修改：使用 Allman 風格（大括號換新行）
SpaceBeforeParens: ControlStatements
SpaceAfterCStyleCast: true
SpaceBeforeAssignmentOperators: true
SpacesInParentheses: false
SpacesInSquareBrackets: false
SpacesInContainerLiterals: false
IndentCaseLabels: false
ColumnLimit: 100
AlignTrailingComments: true
AllowShortIfStatementsOnASingleLine: false  # 新增：禁止單行 if 語句
AlwaysBreakBeforeMultilineStrings: true
`;

suite('Formatter Test Suite', () => {
  let formatter: CubtekFormatter;
  let configManager: ConfigManager;

  suiteSetup(async () => {
    // 建立 config manager with mock context
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
    this.timeout(10000);

    try {
      // 確保 .clang-format 檔案存在
      const clangFormatPath = path.join(
        __dirname,
        '../../../test-data/.clang-format'
      );
      if (!fs.existsSync(path.dirname(clangFormatPath))) {
        fs.mkdirSync(path.dirname(clangFormatPath), { recursive: true });
      }
      fs.writeFileSync(clangFormatPath, clangFormatConfig);

      // 建立測試檔案
      const testFilePath = path.join(__dirname, '../../../test-data/test.c');
      const content = 'void testFunction() { int x=5;if(x>3){x=4;} }';
      console.log('Writing test content:', content);
      fs.writeFileSync(testFilePath, content);

      console.log('Opening document...');
      const uri = vscode.Uri.file(testFilePath);
      const document = await vscode.workspace.openTextDocument(uri);

      console.log('Formatting document...');
      const edits = await formatter.provideDocumentFormattingEdits(document);

      console.log('Checking formatting results...');
      assert.strictEqual(edits.length, 1, 'Expected exactly one edit');
      const formattedText = edits[0].newText;

      // 輸出格式化後的文字以便偵錯
      console.log('Formatted text:', formattedText);

      // 驗證格式化結果
      assert.ok(
        formattedText.includes('{\n    int'),
        'Expected proper indentation after opening brace'
      );
      assert.ok(
        formattedText.includes('if (x > 3)\n    {'),
        'Expected proper spacing and newline in if statement'
      );
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    } finally {
      // 清理測試檔案
      const testFilePath = path.join(__dirname, '../../../test-data/test.c');
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      // 清理 .clang-format 檔案
      const clangFormatPath = path.join(
        __dirname,
        '../../../test-data/.clang-format'
      );
      if (fs.existsSync(clangFormatPath)) {
        fs.unlinkSync(clangFormatPath);
      }
    }
  });
});
