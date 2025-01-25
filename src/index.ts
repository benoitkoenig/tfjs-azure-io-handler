import { ContainerClient } from "@azure/storage-blob";
import type { io } from "@tensorflow/tfjs-core";

import AzureHandler from "./azure-handler";
import getContainerClient, {
  type ContainerClientParams,
} from "./get-container-client";

/**
 * Creates an {@link io.IOHandler} for `tensorflow.js` to save and load models on an azure container
 * @param path The path under which the model should be saved/loaded in the azure container
 * @param containerClientOrParams A {@link ContainerClient} or parameters required to create one.
 * @returns An {@link io.IOHandler} ready to be used by `@tensorflow`
 */
export default function createAzureIoHandler(
  path: string,
  containerClientOrParams: ContainerClient | ContainerClientParams,
): io.IOHandler {
  if (containerClientOrParams instanceof ContainerClient) {
    return new AzureHandler(path, containerClientOrParams);
  }

  const containerClient = getContainerClient(containerClientOrParams);

  return new AzureHandler(path, containerClient);
}
