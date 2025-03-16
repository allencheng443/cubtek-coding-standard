/**
 * @file Extension Test Suite for VSCode extension
 * @description Contains test cases to verify extension functionality
 */

import * as assert from "assert";

/**
 * All VSCode API is available through the 'vscode' module
 * The extension can also be imported for testing
 */
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

/**
 * @description Main test suite for the extension
 * Defines a collection of tests to verify extension functionality
 */
suite("Extension Test Suite", () => {
  /**
   * Display an information message when tests start running
   */
  vscode.window.showInformationMessage("Start all tests.");

  /**
   * @description Basic test case to verify assertion functionality
   * Tests the indexOf method behavior with values not present in the array
   */
  test("Sample test", () => {
    /**
     * Verifies that indexOf returns -1 when the value is not present in the array
     */
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
