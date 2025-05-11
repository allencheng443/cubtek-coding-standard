/**
 * @file Formatter test suite for testing the CubtekFormatter functionality
 * @description Tests the code formatting capabilities using clang-format configuration
 */
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { CubtekFormatter } from "../../src/core/formatter";
import { ConfigManager } from "../../src/utils/config";

/**
 * Custom clang-format configuration for testing
 * Defines formatting rules like:
 * - 4-space indentation
 * - Allman style braces (braces on new lines)
 * - Specific spacing rules for operators and parentheses
 * - 100 character column limit
 * - No single-line if statements
 */
const clangFormatConfig = `---
Language: Cpp
IndentWidth: 4
UseTab: Never
BreakBeforeBraces: Allman
SpaceBeforeParens: ControlStatements
SpaceAfterCStyleCast: true
SpaceBeforeAssignmentOperators: true
SpacesInParentheses: false
SpacesInSquareBrackets: false
SpacesInContainerLiterals: false
IndentCaseLabels: false
ColumnLimit: 100
AlignTrailingComments: true
AllowShortIfStatementsOnASingleLine: false
AlwaysBreakBeforeMultilineStrings: true
`;

/**
 * Test suite for verifying the Formatter functionality
 * Tests that code formatting works correctly with given configuration
 */
suite("Formatter Test Suite", () => {
  let formatter: CubtekFormatter;
  let configManager: ConfigManager;

  /**
   * One-time setup before all tests in the suite
   * Initializes the ConfigManager and CubtekFormatter with a mock VSCode extension context
   * @returns {Promise<void>} Promise that resolves when setup is complete
   */
  suiteSetup(async () => {
    // Create config manager with mock context
    const context = {
      extensionPath: path.join(__dirname, "../../../"),
      globalStoragePath: path.join(__dirname, "../../../test-data"),
      subscriptions: [],
      workspaceState: { get: () => {}, update: () => {} },
      globalState: { get: () => {}, update: () => {} },
    } as unknown as vscode.ExtensionContext;

    configManager = new ConfigManager(context);
    await configManager.initialize();
    formatter = new CubtekFormatter(configManager);
  });

  /**
   * Test case for formatting C code documents
   * Creates a test file, applies formatting, and verifies the results match expectations
   *
   * @this {Mocha.Context} Mocha test context
   * @returns {Promise<void>} Promise that resolves when test is complete
   */
  test("Format C Document", async function () {
    this.timeout(10000);

    try {
      // Ensure the .clang-format configuration file exists
      const clangFormatPath = path.join(
        __dirname,
        "../../../test-data/.clang-format"
      );
      if (!fs.existsSync(path.dirname(clangFormatPath))) {
        fs.mkdirSync(path.dirname(clangFormatPath), { recursive: true });
      }
      fs.writeFileSync(clangFormatPath, clangFormatConfig);

      // Create a test file with unformatted C code
      const testFilePath = path.join(__dirname, "../../../test-data/test.c");
      const content = "void testFunction() { int x=5;if(x>3){x=4;} }";
      console.log("Writing test content:", content);
      fs.writeFileSync(testFilePath, content);

      console.log("Opening document...");
      const uri = vscode.Uri.file(testFilePath);
      const document = await vscode.workspace.openTextDocument(uri);

      console.log("Formatting document...");
      const edits = await formatter.provideDocumentFormattingEdits(document);

      console.log("Checking formatting results...");
      assert.strictEqual(edits.length, 1, "Expected exactly one edit");
      const formattedText = edits[0].newText;

      // Output formatted text for debugging purposes
      console.log("Formatted text:", formattedText);

      // Validate that formatting matches expected patterns
      assert.ok(
        formattedText.includes("{\n    int"),
        "Expected proper indentation after opening brace"
      );
      assert.ok(
        formattedText.includes("if (x > 3)\n    {"),
        "Expected proper spacing and newline in if statement"
      );
    } catch (error) {
      console.error("Test failed with error:", error);
      throw error;
    } finally {
      // Clean up test file
      const testFilePath = path.join(__dirname, "../../../test-data/test.c");
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
      // Clean up .clang-format file
      const clangFormatPath = path.join(
        __dirname,
        "../../../test-data/.clang-format"
      );
      if (fs.existsSync(clangFormatPath)) {
        fs.unlinkSync(clangFormatPath);
      }
    }
  });
});
