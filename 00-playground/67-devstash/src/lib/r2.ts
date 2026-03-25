import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "devstash-files";

// Create S3 client configured for R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});

// File constraints
export const FILE_CONSTRAINTS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
  },
  file: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    extensions: [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
} as const;

// Helper to get file extension
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : "";
}

// Validate file against type constraints
export function validateFile(
  file: File,
  typeName: "image" | "file",
): { valid: boolean; error?: string } {
  const constraints = FILE_CONSTRAINTS[typeName];
  const extension = getFileExtension(file.name);

  // Check file size
  if (file.size > constraints.maxSize) {
    const maxMB = constraints.maxSize / (1024 * 1024);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  // Check extension
  if (!(constraints.extensions as readonly string[]).includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${(constraints.extensions as readonly string[]).join(", ")}`,
    };
  }

  // Check MIME type
  if (!(constraints.mimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Invalid MIME type. Allowed: ${(constraints.mimeTypes as readonly string[]).join(", ")}`,
    };
  }

  return { valid: true };
}

// Generate unique key for R2 storage
export function generateR2Key(
  userId: string,
  typeName: string,
  filename: string,
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${typeName}s/${userId}/${timestamp}-${randomStr}-${sanitizedFilename}`;
}

// Upload file to R2
export async function uploadToR2(
  key: string,
  file: Buffer,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Return the R2 URL
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

// Get file from R2 (for download proxy)
export async function getFileFromR2(
  key: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return null;
    }

    const body = Buffer.from(await response.Body.transformToByteArray());
    const contentType = response.ContentType || "application/octet-stream";

    return { body, contentType };
  } catch {
    return null;
  }
}

// Extract key from R2 URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // R2 URLs are like: https://bucket.account.r2.cloudflarestorage.com/path/to/file
    // We need just the path part
    return urlObj.pathname.slice(1); // Remove leading slash
  } catch {
    return null;
  }
}
