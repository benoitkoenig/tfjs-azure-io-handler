import { describe, expect, it } from "vitest";
import { AnonymousCredential } from "@azure/storage-blob";
import testIoHandler from "./test-io-handler";

// Environment variable names are picked to be consistent with https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-data-operations-cli#set-environment-variables-for-authorization-parameters
const AZURE_STORAGE_ACCOUNT = import.meta.env["AZURE_STORAGE_ACCOUNT"];
const AZURE_STORAGE_KEY = import.meta.env["AZURE_STORAGE_KEY"];
const AZURE_STORAGE_SAS_TOKEN = import.meta.env["AZURE_STORAGE_SAS_TOKEN"];

if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY || !AZURE_STORAGE_SAS_TOKEN) {
  throw new Error("Environment variables missing in .env.test");
}

describe("createAzureIoHandler", () => {
  it("should save and load a model from azure using the storageSasToken", async () => {
    await testIoHandler(
      `browser-integration-test-storageSasToken-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: AZURE_STORAGE_ACCOUNT,
        storageSasToken: AZURE_STORAGE_SAS_TOKEN,
      },
    );
  });

  it.todo("should load a model from azure using anonymous authentication");

  it("should throw when trying to save a model to azure using anonymous authentication", async () => {
    await expect(
      testIoHandler(
        `browser-integration-test-saving-anonymous-${new Date().toISOString()}`,
        {
          containerName: "tfjs-azure-io-handler-with-anonymous-access",
          storageAccount: AZURE_STORAGE_ACCOUNT,
          credential: new AnonymousCredential(),
        },
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot save model to azure using anonymous authentication]`,
    );
  });
});
