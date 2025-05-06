import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  vscodeExecutablePath: "stable",
  launchArgs: [
    "--disable-extensions",
    // "--disable-notifications",
    "--skip-welcome",
    // "--disable-telementry",
    "--no-sandbox",
    "--force-node-api-uncaught-exceptions-policy=true",
    "--no-warnings",
  ],
  downloadVersion: false,
  useExistingVSCode: true,
});
