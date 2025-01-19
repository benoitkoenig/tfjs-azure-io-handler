import { ContainerClient } from "@azure/storage-blob";
import { io } from "@tensorflow/tfjs-core";

// TODO memoize this handler per name
export default function createIoHandler(name: string): io.IOHandler {
  // TODO: memoize the containerClient once.
  const containerClient = new ContainerClient(
    `https://${process.env["AZURE_STORAGE_ACCOUNT"]!}.blob.core.windows.net/${process.env["AZURE_CONTAINER_NAME"]!}?${process.env["AZURE_STORAGE_SAS_TOKEN"]!}`,
  );

  const modelJsonBlobClient = containerClient.getBlobClient(
    `modelweights/${name}/model.json`,
  );
  const weightsBlobClient = containerClient.getBlobClient(
    `modelweights/${name}/weights.bin`,
  );

  return {
    load: async () => {
      const modelJsonBuffer = (await modelJsonBlobClient.downloadToBuffer())
        .buffer;
      const weightsBuffer = (await weightsBlobClient.downloadToBuffer()).buffer;

      const modelJson = JSON.parse(modelJsonBuffer.toString());

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
          `modelweights/${name}/model.json`,
          modelJsonBuffer,
          modelJsonBuffer.length,
        ),
        containerClient.uploadBlockBlob(
          `modelweights/${name}/weights.bin`,
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
