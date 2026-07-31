import { upload } from "@vercel/blob/client";

/**
 * Uploads a file directly from the browser to Vercel Blob, bypassing the
 * serverless request-body size limit. Returns the public URL + pathname to
 * persist via tRPC.
 */
export async function uploadToBlob(
  prefix: string,
  file: File,
): Promise<{ url: string; pathname: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await upload(`${prefix}/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
    contentType: file.type || undefined,
  });
  return { url: blob.url, pathname: blob.pathname };
}
