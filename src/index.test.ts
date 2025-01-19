import { describe, expect, it } from "vitest";
import type { io } from "@tensorflow/tfjs-core";
import * as tf from "@tensorflow/tfjs-node";
import createIoHandler from "src";

describe("createAzureIoHandler", () => {
  async function testIoHandler(
    loadingHandler: io.IOHandler,
    savingHandler = loadingHandler,
  ) {
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
    // to ensure that the test does not pass on a flawed result, eg. if the test return an empty array
    expect(originalModelPrediction).toStrictEqual([[22]]);
    expect(savedAndLoadedModelPrediction).toStrictEqual([[22]]);

    originalModel.dispose();
    savedAndLoadedModel.dispose();

    // TODO: delete the created file
  }

  it("should save and load a model from azure using the storageAccountKey", async () => {
    const handler = createIoHandler(
      `createIoHandler-integration-test-storageAccountKey-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        storageAccountKey: process.env["AZURE_STORAGE_ACCOUNT_KEY"]!,
      },
    );

    await testIoHandler(handler);
  });

  it("should save and load a model from azure using the storageSasToken", async () => {
    const handler = createIoHandler(
      `createIoHandler-integration-test-storageSasToken-${new Date().toISOString()}`,
      {
        containerName: "tfjs-azure-io-handler",
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        storageSasToken: process.env["AZURE_STORAGE_SAS_TOKEN"]!,
      },
    );

    await testIoHandler(handler);
  });

  it("should load a model from azure using anonymous authentication", async () => {
    const name = `createIoHandler-integration-test-anonymous-${new Date().toISOString()}`;

    const anonymousHandler = createIoHandler(name, {
      containerName: "tfjs-azure-io-handler-with-anonymous-access",
      isAnonymous: true,
      storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
    });

    const authentifiedHandler = createIoHandler(name, {
      containerName: "tfjs-azure-io-handler-with-anonymous-access",
      storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
      storageAccountKey: process.env["AZURE_STORAGE_ACCOUNT_KEY"]!,
    });

    await testIoHandler(anonymousHandler, authentifiedHandler);
  });
});
