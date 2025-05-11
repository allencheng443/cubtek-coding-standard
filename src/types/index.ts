/**
 * Central type definitions for the CubTEK Coding Standard extension.
 *
 * @fileoverview Exports all type definitions and extends VSCode interfaces.
 */

export * from "./config";
export * from "./diagnostic";
export * from "./rule";

import * as vscode from "vscode";

/**
 * Extends VSCode's Diagnostic interface to support rule traceability.
 */
declare module "vscode" {
  export interface Diagnostic {
    /**
     * Rule identifier that produced this diagnostic.
     * Format: "CUBTEK-CATEGORY-###" (e.g., "CUBTEK-NAME-001").
     */
    ruleId?: string;
  }
}
