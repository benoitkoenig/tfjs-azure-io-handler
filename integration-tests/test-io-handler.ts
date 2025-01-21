import * as tf from "@tensorflow/tfjs";
import { expect } from "vitest";

import createAzureIoHandler from "../src";
import type { ContainerClientParams } from "../src/get-container-client";
import getContainerClient from "../src/get-container-client";

export default async function testIoHandler(
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

  try {
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
  } finally {
    /**
     * Failing to dispose the models in case an error is acceptable within integration tests,
     * so this try/finally block focuses exclusively on clearing up resources on azure which matters more.
     */
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
}
