import { put, del } from "@vercel/blob";
import { nanoid } from "nanoid";

/**
 * Uploads a base64-encoded file to Vercel Blob and returns its public URL + key.
 * `prefix` is the folder, e.g. "resources" or "gallery".
 */
export async function uploadBase64(
  prefix: string,
  fileName: string,
  base64Data: string,
  contentType?: string,
): Promise<{ url: string; key: string; size: number }> {
  // Strip a data-URL prefix if present (e.g. "data:image/png;base64,....").
  const commaIdx = base64Data.indexOf(",");
  const raw = base64Data.startsWith("data:") && commaIdx !== -1
    ? base64Data.slice(commaIdx + 1)
    : base64Data;

  const buffer = Buffer.from(raw, "base64");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${prefix}/${nanoid()}-${safeName}`;

  const blob = await put(key, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });

  return { url: blob.url, key, size: buffer.byteLength };
}

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Non-fatal: the DB record is the source of truth for the UI.
  }
}
