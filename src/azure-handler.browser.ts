import type { ContainerClient } from "@azure/storage-blob";
import { io } from "@tensorflow/tfjs-core";

import getModelJsonForModelArtifacts from "./get-model-json-for-model-artifacts";

export default class AzureHandler implements io.IOHandler {
  constructor(
    private path: string,
    private containerClient: ContainerClient,
  ) {}

  async load() {
    const modelJsonBlobClient = this.containerClient.getBlobClient(
      `${this.path}/model.json`,
    );

    const modelJson: io.ModelJSON = JSON.parse(
      await (await (await modelJsonBlobClient.download()).blobBody!).text(),
    );

    const weightsManifest = modelJson.weightsManifest;

    const weightSpecs = weightsManifest.flatMap(({ weights }) => weights);

    const weightsData = await Promise.all(
      weightsManifest
        .flatMap(({ paths }) => paths)
        .map((subPath) =>
          this.containerClient.getBlobClient(`${this.path}/${subPath}`),
        )
        .map(
          async (blobClient) =>
            await (await (await blobClient.download()).blobBody)!.arrayBuffer(),
        ),
    );

    return io.getModelArtifactsForJSONSync(modelJson, weightSpecs, weightsData);
  }

  async save(modelArtifacts: io.ModelArtifacts): Promise<io.SaveResult> {
    const weightsBuffer = modelArtifacts.weightData!;

    if (!modelArtifacts.weightSpecs) {
      throw new Error(
        "Missing implementation in tfjs-azure-io-handler: `weightSpecs` is missing from `modelArtifacts`",
      );
    }

    const modelJson = getModelJsonForModelArtifacts(modelArtifacts, [
      {
        paths: Array.isArray(weightsBuffer)
          ? weightsBuffer.map((_, i) => `weights-${i}.bin`)
          : ["weights.bin"],
        weights: modelArtifacts.weightSpecs,
      },
    ]);

    const modelJsonBuffer = new TextEncoder().encode(JSON.stringify(modelJson));

    const modelJsonUploadPromise = this.containerClient.uploadBlockBlob(
      `${this.path}/model.json`,
      modelJsonBuffer,
      modelJsonBuffer.length,
    );

    const weightsUploadPromises = Array.isArray(weightsBuffer)
      ? weightsBuffer.map((wb, i) =>
          this.containerClient.uploadBlockBlob(
            `${this.path}/weights-${i}.bin`,
            wb,
            wb.byteLength,
          ),
        )
      : [
          this.containerClient.uploadBlockBlob(
            `${this.path}/weights.bin`,
            weightsBuffer,
            weightsBuffer.byteLength,
          ),
        ];

    await Promise.all([modelJsonUploadPromise, ...weightsUploadPromises]);

    const weightDataBytes = Array.isArray(weightsBuffer)
      ? weightsBuffer
          .map(({ byteLength }) => byteLength)
          .reduce((a, b) => a + b, 0)
      : weightsBuffer.byteLength;

    return {
      modelArtifactsInfo: {
        dateSaved: new Date(),
        modelTopologyType: "JSON",
        modelTopologyBytes: modelJsonBuffer.length,
        weightDataBytes,
      },
    };
  }
}
