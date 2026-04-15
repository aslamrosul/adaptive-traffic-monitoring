// Azure Blob Storage (ADLS Gen2) Configuration
import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'processed-data';

// Initialize Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export { blobServiceClient, containerClient };

// Helper function to upload file
export async function uploadBlob(blobName: string, data: Buffer | string) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(data, Buffer.byteLength(data as any));
  return blockBlobClient.url;
}

// Helper function to download file
export async function downloadBlob(blobName: string) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download();
  return downloadResponse.readableStreamBody;
}
