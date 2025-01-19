import type { io } from "@tensorflow/tfjs-core";
import getContainerClient, {
  type ContainerClientParams,
} from "./get-container-client";

export default function createAzureIoHandler(
  name: string,
  containerClientParams: ContainerClientParams,
): io.IOHandler {
  const containerClient = getContainerClient(containerClientParams);

  const modelJsonBlobClient = containerClient.getBlobClient(
    `${name}/model.json`,
  );
  const weightsBlobClient = containerClient.getBlobClient(
    `${name}/weights.bin`,
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
      if (containerClientParams.isAnonymous) {
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
          `${name}/model.json`,
          modelJsonBuffer,
          modelJsonBuffer.length,
        ),
        containerClient.uploadBlockBlob(
          `${name}/weights.bin`,
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
