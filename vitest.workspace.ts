import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    envPrefix: ["AZURE_"],
    test: {
      name: "node integration tests",
      include: ["integration-tests/node.test.ts"],
    },
  },
  {
    envPrefix: ["AZURE_"],
    test: {
      name: "browser integration tests",
      include: ["integration-tests/browser.test.ts"],
      browser: {
        provider: "playwright",
        enabled: true,
        instances: [{ browser: "chromium" }],
      },
    },
  },
]);
