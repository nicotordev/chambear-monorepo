import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.warn("R2 credentials not found in environment variables");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export async function uploadFileToR2(
  fileBuffer: Buffer | Uint8Array,
  folderName: string,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `${folderName}/${Date.now()}-${fileName}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // Return the public URL
    // If publicUrl is defined (e.g. custom domain), use it. Otherwise construct standard R2 url if possible or just the key.
    // Usually R2 requires a custom domain or worker for public access.
    if (publicUrl) {
      return `${publicUrl}/${key}`;
    }

    // Fallback or assuming the user will configure public access.
    return key;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
}
