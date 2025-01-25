import type { BlobClient } from "@azure/storage-blob";

// rollup is in charge of importing this file instead of `azure-buffer.utils.node.ts` when building for browsers

export async function downloadAsText(blobClient: BlobClient) {
  return await (await (await blobClient.download()).blobBody!).text();
}

export async function downloadAsBuffer(blobClient: BlobClient) {
  return await (await (await blobClient.download()).blobBody)!.arrayBuffer();
}
