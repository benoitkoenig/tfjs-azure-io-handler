import type { ContainerClient } from "@azure/storage-blob";
import { io } from "@tensorflow/tfjs-core";

/**
 * This is virtually a copy/paste from tensorflow.js's io#getModelJsonForModelArtifacts, which is not exported.
 * TODO: investigate if there is a reason for it not to be exported?
 */
export function getModelJsonForModelArtifacts(
  artifacts: io.ModelArtifacts,
  manifest: io.WeightsManifestConfig,
): io.ModelJSON {
  const result: io.ModelJSON = {
    modelTopology: artifacts.modelTopology as unknown as object,
    weightsManifest: manifest,
  };

  if (artifacts.generatedBy) {
    result.generatedBy = artifacts.generatedBy;
  }

  if (artifacts.convertedBy) {
    result.convertedBy = artifacts.convertedBy;
  }

  if (artifacts.format) {
    result.format = artifacts.format;
  }

  if (artifacts.signature) {
    result.signature = artifacts.signature;
  }

  if (artifacts.userDefinedMetadata) {
    result.userDefinedMetadata = artifacts.userDefinedMetadata;
  }

  if (artifacts.modelInitializer) {
    result.modelInitializer = artifacts.modelInitializer;
  }

  if (artifacts.initializerSignature) {
    result.initializerSignature = artifacts.initializerSignature;
  }

  if (artifacts.trainingConfig) {
    result.trainingConfig = artifacts.trainingConfig;
  }

  return result;
}

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
      (await modelJsonBlobClient.downloadToBuffer()).toString("utf-8"),
    );

    const weightsManifest = modelJson.weightsManifest;

    const weightSpecs = weightsManifest.flatMap(({ weights }) => weights);

    const weightsData = await Promise.all(
      weightsManifest
        .flatMap(({ paths }) => paths)
        .map((subPath) =>
          this.containerClient.getBlobClient(`${this.path}/${subPath}`),
        )
        .map(async (blobClient) => await blobClient.downloadToBuffer()),
    );

    return io.getModelArtifactsForJSONSync(modelJson, weightSpecs, weightsData);
  }

  async save(modelArtifacts: io.ModelArtifacts): Promise<io.SaveResult> {
    const weightsBuffer = modelArtifacts.weightData!;

    const modelJson = {
      modelTopology: modelArtifacts.modelTopology,
      weightsManifest: [
        {
          paths: Array.isArray(weightsBuffer)
            ? weightsBuffer.map((_, i) => `weights-${i}.bin`)
            : ["weights.bin"],
          weights: modelArtifacts.weightSpecs,
        },
      ],
      format: modelArtifacts.format,
      generatedBy: modelArtifacts.generatedBy,
      convertedBy: modelArtifacts.convertedBy,
    };

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
