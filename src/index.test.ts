import { describe, expect, it } from "vitest";
import type { io } from "@tensorflow/tfjs-core";
import * as tf from "@tensorflow/tfjs-node";
import createIoHandler from "src";

describe("createAzureIoHandler", () => {
  async function testIoHandler(handler: io.IOHandler) {
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

    await originalModel.save(handler);

    const savedAndLoadedModel = await tf.loadLayersModel(handler);

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
        containerName: process.env["AZURE_CONTAINER_NAME"]!,
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
        containerName: process.env["AZURE_CONTAINER_NAME"]!,
        storageAccount: process.env["AZURE_STORAGE_ACCOUNT"]!,
        storageSasToken: process.env["AZURE_STORAGE_SAS_TOKEN"]!,
      },
    );

    await testIoHandler(handler);
  });
});
