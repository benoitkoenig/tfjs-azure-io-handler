import type { BlobClient } from "@azure/storage-blob";

export async function downloadAsText(blobClient: BlobClient) {
  return (await blobClient.downloadToBuffer()).toString("utf-8");
}

export async function downloadAsBuffer(blobClient: BlobClient) {
  return blobClient.downloadToBuffer();
}
