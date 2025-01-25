import type { io } from "@tensorflow/tfjs-core";

import AzureHandler from "./azure-handler.node";
import getContainerClient, {
  type ContainerClientParams,
} from "./get-container-client";

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

  return new AzureHandler(path, containerClient);
}
