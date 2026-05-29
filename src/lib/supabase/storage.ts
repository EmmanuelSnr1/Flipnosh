/**
 * Supabase Storage upload helpers — client-side only.
 *
 * Uses the anon-key Supabase client so the user's auth session governs access
 * (RLS on storage.objects). Never import from server code.
 *
 * Bucket layout
 *   restaurant-assets/  {restaurantId}/logo.{ext}
 *                       {restaurantId}/hero.{ext}
 *   menu-item-images/   {restaurantId}/{uuid}.{ext}
 */

import { supabase } from "./client";

export type StorageBucket = "restaurant-assets" | "menu-item-images";

/** Map MIME type → canonical extension. */
function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg":  "jpg",
    "image/png":  "png",
    "image/webp": "webp",
    "image/gif":  "gif",
  };
  return map[mimeType] ?? "jpg";
}

/**
 * Upload a file to Supabase Storage and return its permanent public URL.
 *
 * @param bucket  The target bucket
 * @param path    Storage object path, e.g. `{restaurantId}/logo.jpg`
 *                If the path has no extension we append one from the MIME type.
 * @param file    The File object from an <input type="file">
 *
 * Uses upsert so re-uploading to the same path replaces the old file.
 * The public URL is stable — no auth token required to load the image.
 */
export async function uploadImage(opts: {
  bucket: StorageBucket;
  path: string;
  file: File;
}): Promise<string> {
  const { bucket, file } = opts;

  // Append extension if the caller omitted it
  const hasExt = opts.path.includes(".");
  const path   = hasExt ? opts.path : `${opts.path}.${extFromMime(file.type)}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert:      true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a storage object.  Best-effort — ignores "not found" errors.
 */
export async function deleteImage(opts: {
  bucket: StorageBucket;
  path: string;
}): Promise<void> {
  await supabase.storage.from(opts.bucket).remove([opts.path]);
}

/**
 * Derive the storage path from a public URL (reverse of getPublicUrl).
 * Returns null if the URL doesn't belong to this project.
 */
export function pathFromPublicUrl(
  publicUrl: string,
  bucket: StorageBucket,
): string | null {
  try {
    const url    = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx    = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}
