import {
  AnonymousCredential,
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

interface BaseParams {
  /**
   * The name of the container within the storage account in which you want to store the files.
   */
  containerName: string;
  /**
   * If true, the handler does not authenticate to azure and uses anonymous credentials.
   * In this case, the handler cannot write to azure and saving a model is not possible.
   * For anonymous authentication to work, ensure that you enabled an anonymous access level (`Blob` or `Container`) on your container.
   * Only one of {@link isAnonymous}, {@link storageAccountKey}, or {@link storageSasToken} should be set.
   */
  isAnonymous?: boolean | undefined;
  /**
   * The name of the storage account in which you want to store the files.
   */
  storageAccount: string;
  /**
   * An access key to the storage account in which you want to store the files.
   * Only one of {@link isAnonymous}, {@link storageAccountKey}, or {@link storageSasToken} should be set.
   */
  storageAccountKey?: string | undefined;
  /**
   * A SAS token to the container in which you want to store the files.
   * Only one of {@link isAnonymous}, {@link storageAccountKey}, or {@link storageSasToken} should be set.
   */
  storageSasToken?: string | undefined;
}

interface SasTokenParams extends BaseParams {
  isAnonymous?: false | undefined;
  storageAccountKey?: undefined;
  storageSasToken: string;
}

interface AccountKeyParams extends BaseParams {
  isAnonymous?: false | undefined;
  storageAccountKey: string;
  storageSasToken?: undefined;
}

interface AnonymousParams extends BaseParams {
  isAnonymous: true;
  storageAccountKey?: undefined;
  storageSasToken?: undefined;
}

/**
 * Parameters required to connect to an azure container
 */
export type ContainerClientParams =
  | SasTokenParams
  | AccountKeyParams
  | AnonymousParams;

export default function getContainerClient(params: ContainerClientParams) {
  const {
    containerName,
    isAnonymous,
    storageAccount,
    storageAccountKey,
    storageSasToken,
  } = params;

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

  const credential = isAnonymous
    ? new AnonymousCredential()
    : storageAccountKey
      ? new StorageSharedKeyCredential(storageAccount, storageAccountKey)
      : null;

  if (!credential) {
    throw new Error(
      "Cannot connect to azure: one of `storageAccountKey` or `storageSasToken` must be set",
    );
  }

  const blobServiceClient = new BlobServiceClient(
    `https://${storageAccount}.blob.core.windows.net`,
    credential,
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);

  return containerClient;
}
