import {
  AnonymousCredential,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { describe, expect, it } from "vitest";

import testIoHandler from "./test-io-handler";

// Environment variable names are picked to be consistent with https://learn.microsoft.com/en-us/azure/storage/blobs/authorize-data-operations-cli#set-environment-variables-for-authorization-parameters
const AZURE_STORAGE_ACCOUNT = process.env["AZURE_STORAGE_ACCOUNT"];
const AZURE_STORAGE_KEY = process.env["AZURE_STORAGE_KEY"];
const AZURE_STORAGE_SAS_TOKEN = process.env["AZURE_STORAGE_SAS_TOKEN"];

if (!AZURE_STORAGE_ACCOUNT || !AZURE_STORAGE_KEY || !AZURE_STORAGE_SAS_TOKEN) {
  throw new Error("Environment variables missing in .env.test");
}

describe("createAzureIoHandler", () => {
  it("should save and load a model from azure using the storageAccountKey", async () => {
    await testIoHandler(
      `node-integration-test-storageAccountKey-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: AZURE_STORAGE_ACCOUNT,
        credential: new StorageSharedKeyCredential(
          AZURE_STORAGE_ACCOUNT,
          AZURE_STORAGE_KEY,
        ),
      },
    );
  });

  it("should save and load a model from azure using the storageSasToken", async () => {
    await testIoHandler(
      `node-integration-test-storageSasToken-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: AZURE_STORAGE_ACCOUNT,
        storageSasToken: AZURE_STORAGE_SAS_TOKEN,
      },
    );
  });

  it("should load a model from azure using anonymous authentication", async () => {
    await testIoHandler(
      `node-integration-test-anonymous-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler-with-anonymous-access",
        storageAccount: AZURE_STORAGE_ACCOUNT,
        credential: new AnonymousCredential(),
      },
      {
        containerName: "tfjs-azure-io-handler-with-anonymous-access",
        storageAccount: AZURE_STORAGE_ACCOUNT,
        credential: new StorageSharedKeyCredential(
          AZURE_STORAGE_ACCOUNT,
          AZURE_STORAGE_KEY,
        ),
      },
    );
  });

  it("should throw when trying to save a model to azure using anonymous authentication", async () => {
    await expect(
      testIoHandler(
        `node-integration-test-saving-anonymous-${new Date().toISOString()}`,
        {
          containerName: "tfjs-azure-io-handler-with-anonymous-access",
          storageAccount: AZURE_STORAGE_ACCOUNT,
          credential: new AnonymousCredential(),
        },
      ),
    ).rejects.toThrowError();
  });
});
