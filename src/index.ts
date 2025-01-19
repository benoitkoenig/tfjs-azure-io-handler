import type { io } from "@tensorflow/tfjs-core";
import getContainerClient, {
  type ContainerClientParams,
} from "./get-container-client";
import { AnonymousCredential } from "@azure/storage-blob";

/**
 * Creates an {@link io.IOHandler} for `@tensorflow` to save and load models on an azure container
 * @param path The path under which the model should be saved/loaded in the azure container
 * @param containerClientParams Parameters required to connect to an azure container
 * @returns An {@link io.IOHandler} ready to be used by `@tensorflow`
 */
export default function createAzureIoHandler(
  path: string,
  containerClientParams: ContainerClientParams,
): io.IOHandler {
  const containerClient = getContainerClient(containerClientParams);

  const modelJsonBlobClient = containerClient.getBlobClient(
    `${path}/model.json`,
  );
  const weightsBlobClient = containerClient.getBlobClient(
    `${path}/weights.bin`,
  );

  return {
    load: async () => {
      const modelJsonBuffer = await modelJsonBlobClient.downloadToBuffer();
      const weightsBuffer = await weightsBlobClient.downloadToBuffer();

      const modelJson = JSON.parse(modelJsonBuffer.toString("utf8"));

      return {
        modelTopology: modelJson.modelTopology,
        format: modelJson.format,
        generatedBy: modelJson.generatedBy,
        convertedBy: modelJson.convertedBy,
        weightData: weightsBuffer,
        weightSpecs: modelJson.weightsManifest[0].weights,
      };
    },
    save: async (modelArtifacts) => {
      if (
        containerClientParams.credential &&
        containerClientParams.credential instanceof AnonymousCredential
      ) {
        throw new Error(
          "Cannot save model to azure using anonymous authentication",
        );
      }

      const modelJson = {
        modelTopology: modelArtifacts.modelTopology,
        weightsManifest: [
          {
            paths: ["weights.bin"],
            weights: modelArtifacts.weightSpecs,
          },
        ],
        format: modelArtifacts.format,
        generatedBy: modelArtifacts.generatedBy,
        convertedBy: modelArtifacts.convertedBy,
      };
      const modelJsonBuffer = Buffer.from(JSON.stringify(modelJson), "utf8");
      const weightsBuffer = modelArtifacts.weightData!;

      if (Array.isArray(weightsBuffer)) {
        throw new Error("TODO Not implemented: weightsBuffer as an array");
      }

      await Promise.all([
        containerClient.uploadBlockBlob(
          `${path}/model.json`,
          modelJsonBuffer,
          modelJsonBuffer.length,
        ),
        containerClient.uploadBlockBlob(
          `${path}/weights.bin`,
          weightsBuffer,
          weightsBuffer.byteLength,
        ),
      ]);

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON",
          modelTopologyBytes: modelJsonBuffer.length,
          weightDataBytes: weightsBuffer.byteLength,
        },
      };
    },
  } as io.IOHandler;
}
