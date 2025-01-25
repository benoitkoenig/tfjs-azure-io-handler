import type { TokenCredential } from "@azure/core-auth";
import {
  type AnonymousCredential,
  BlobServiceClient,
  ContainerClient,
  type StorageSharedKeyCredential,
} from "@azure/storage-blob";

interface BaseParams {
  /**
   * The name of the container within the storage account in which you want to store the files.
   */
  containerName: string;
  /**
   * The name of the storage account in which you want to store the files.
   */
  storageAccount: string;
  /**
   * An access key to the storage account in which you want to store the files.
   * Only one of {@link credential} or {@link storageSasToken} should be set.
   */
  credential?:
    | StorageSharedKeyCredential
    | AnonymousCredential
    | TokenCredential
    | undefined;
  /**
   * A SAS token to the container in which you want to store the files.
   * Only one of {@link credential} or {@link storageSasToken} should be set.
   */
  storageSasToken?: string | undefined;
}

interface SasTokenParams extends BaseParams {
  credential?: undefined;
  storageSasToken: string;
}

interface CredentialParams extends BaseParams {
  credential: Exclude<BaseParams["credential"], undefined>;
  storageSasToken?: undefined;
}

/**
 * Parameters required to connect to an Azure Storage container allowing you to manipulate its blobs.
 */
export type ContainerClientParams = SasTokenParams | CredentialParams;

export default function getContainerClient(params: ContainerClientParams) {
  const { containerName, credential, storageAccount, storageSasToken } = params;

  if (!storageAccount || !containerName) {
    throw new Error(
      "Cannot connect to azure: `storageAccount` or `containerName` is not set",
    );
  }

  if (storageSasToken) {
    const containerClient = new ContainerClient(
      `https://${storageAccount}.blob.core.windows.net/${containerName}?${storageSasToken}`,
    );

    return containerClient;
  }

  if (credential) {
    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccount}.blob.core.windows.net`,
      credential,
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    return containerClient;
  }

  throw new Error(
    "Cannot connect to azure: one of `storageAccountKey` or `credential` must be set",
  );
}
