import {
  AnonymousCredential,
  BlobServiceClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

interface SasTokenParams {
  containerName: string;
  isAnonymous?: false;
  storageAccount: string;
  storageAccountKey?: undefined;
  storageSasToken: string;
}

interface AccountKeyParams {
  containerName: string;
  isAnonymous?: false;
  storageAccount: string;
  storageAccountKey: string;
  storageSasToken?: undefined;
}

interface AnonymousParams {
  containerName: string;
  isAnonymous: true;
  storageAccount: string;
  storageAccountKey?: undefined;
  storageSasToken?: undefined;
}

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

  if (isAnonymous) {
    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccount}.blob.core.windows.net`,
      new AnonymousCredential(),
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    return containerClient;
  }

  if (!storageAccount || !containerName) {
    throw new Error(
      "Cannot connect to azure: `storageAccount` or `containerName` is not set",
    );
  }

  if (storageAccountKey) {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      process.env["AZURE_STORAGE_ACCOUNT"]!,
      process.env["AZURE_STORAGE_ACCOUNT_KEY"]!,
    );

    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccount}.blob.core.windows.net`,
      sharedKeyCredential,
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    return containerClient;
  }

  if (storageSasToken) {
    const containerClient = new ContainerClient(
      `https://${storageAccount}.blob.core.windows.net/${containerName}?${storageSasToken}`,
    );

    return containerClient;
  }

  throw new Error(
    "Cannot connect to azure: one of `storageAccountKey` or `storageSasToken` must be set",
  );
}
