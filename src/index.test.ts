import { describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs-node";
import {
  AnonymousCredential,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import type { ContainerClientParams } from "./get-container-client";
import createAzureIoHandler from ".";
import getContainerClient from "./get-container-client";

describe("createAzureIoHandler", () => {
  async function testIoHandler(
    path: string,
    loadingHandlerParams: ContainerClientParams,
    savingHandlerParams?: ContainerClientParams,
  ) {
    const loadingHandler = createAzureIoHandler(path, loadingHandlerParams);
    const savingHandler = savingHandlerParams
      ? createAzureIoHandler(path, savingHandlerParams)
      : loadingHandler;

    const originalModel = tf.sequential({
      layers: [
        tf.layers.inputLayer({ inputShape: [6] }),
        tf.layers.dense({
          units: 1,
          kernelInitializer: "ones",
          biasInitializer: "ones",
        }),
      ],
    });

    await originalModel.save(savingHandler);

    const savedAndLoadedModel = await tf.loadLayersModel(loadingHandler);

    const { $originalModelPrediction, $savedAndLoadedModelPrediction } =
      tf.tidy(() => {
        const $mockInput = tf.tensor([[1, 2, 3, 4, 5, 6]]);

        return {
          $originalModelPrediction: originalModel.predict(
            $mockInput,
          ) as tf.Tensor2D,
          $savedAndLoadedModelPrediction: savedAndLoadedModel.predict(
            $mockInput,
          ) as tf.Tensor2D,
        };
      });

    const [originalModelPrediction, savedAndLoadedModelPrediction] =
      await Promise.all([
        $originalModelPrediction.array(),
        $savedAndLoadedModelPrediction.array(),
      ]);

    $originalModelPrediction.dispose();
    $savedAndLoadedModelPrediction.dispose();

    // Explicitely check that they are both equal to `[[22]]` instead of checking that they are equal to each other
    // to ensure that the test does not pass on a flawed result, eg. if the test returns an empty array
    expect(originalModelPrediction).toStrictEqual([[22]]);
    expect(savedAndLoadedModelPrediction).toStrictEqual([[22]]);

    originalModel.dispose();
    savedAndLoadedModel.dispose();

    const containerClient = getContainerClient(
      savingHandlerParams ?? loadingHandlerParams,
    );

    await Promise.all([
      containerClient.deleteBlob(`${path}/model.json`, {
        deleteSnapshots: "include",
      }),
      containerClient.deleteBlob(`${path}/weights.bin`, {
        deleteSnapshots: "include",
      }),
    ]);
  }

  it("should save and load a model from azure using the storageAccountKey", async () => {
    await testIoHandler(
      `createIoHandler-integration-test-storageAccountKey-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        credential: new StorageSharedKeyCredential(
          process.env["AZURE_STORAGE_ACCOUNT"]!,
          process.env["AZURE_STORAGE_ACCOUNT_KEY"]!,
        ),
      },
    );
  });

  it("should save and load a model from azure using the storageSasToken", async () => {
    await testIoHandler(
      `createIoHandler-integration-test-storageSasToken-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        storageSasToken: process.env["AZURE_STORAGE_SAS_TOKEN"]!,
      },
    );
  });

  it("should load a model from azure using anonymous authentication", async () => {
    await testIoHandler(
      `createIoHandler-integration-test-anonymous-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler-with-anonymous-access",
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        credential: new AnonymousCredential(),
      },
      {
        containerName: "tfjs-azure-io-handler-with-anonymous-access",
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        credential: new StorageSharedKeyCredential(
          process.env["AZURE_STORAGE_ACCOUNT"]!,
          process.env["AZURE_STORAGE_ACCOUNT_KEY"]!,
        ),
      },
    );
  });

  it("should throw when trying to save a model to azure using anonymous authentication", async () => {
    await expect(
      testIoHandler(
        `createIoHandler-integration-test-anonymous-${new Date().toISOString()}`,
        {
          containerName: "tfjs-azure-io-handler-with-anonymous-access",
          storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
          credential: new AnonymousCredential(),
        },
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot save model to azure using anonymous authentication]`,
    );
  });
});
