/**
 * ImageUpload — reusable file-picker + Supabase Storage uploader.
 *
 * Renders a dashed drop-zone. On file selection:
 *  1. Shows a local blob preview immediately (zero latency).
 *  2. Uploads to Supabase Storage in the background.
 *  3. Calls onUploaded(publicUrl) once persisted.
 *  4. Replaces the blob URL with the permanent CDN URL in state.
 *
 * Usage:
 *   <ImageUpload
 *     label="Logo"
 *     currentUrl={branding.logo_url ?? undefined}
 *     bucket="restaurant-assets"
 *     path={`${restaurantId}/logo`}          // extension auto-appended
 *     aspect="aspect-square"
 *     onUploaded={(url) => saveToDb(url)}
 *     onCleared={() => saveToDb(null)}
 *   />
 */

import { useState, useRef, useEffect } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, type StorageBucket } from "@/lib/supabase/storage";

interface ImageUploadProps {
  label: string;
  /** Existing persistent URL from the DB (not a blob). */
  currentUrl?: string;
  bucket: StorageBucket;
  /**
   * Storage object path (without extension — we append from MIME).
   * e.g.  `{restaurantId}/logo`  or  `{restaurantId}/{uuid}`
   */
  path: string;
  /** Tailwind aspect-ratio class, e.g. "aspect-square" or "aspect-[16/9]" */
  aspect?: string;
  /** Called with the permanent public URL after a successful upload. */
  onUploaded: (url: string) => void;
  /** Called when the user removes the current image. */
  onCleared: () => void;
}

export function ImageUpload({
  label,
  currentUrl,
  bucket,
  path,
  aspect = "aspect-square",
  onUploaded,
  onCleared,
}: ImageUploadProps) {
  const [preview, setPreview]     = useState<string | undefined>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  // Track the current blob URL so we can revoke it when done
  const blobRef = useRef<string | null>(null);

  // Sync if parent passes a new currentUrl (e.g. after a full-page reload)
  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const blobUrl = URL.createObjectURL(file);
    blobRef.current = blobUrl;
    setPreview(blobUrl);
    setUploading(true);

    try {
      const publicUrl = await uploadImage({ bucket, path, file });
      // Swap blob for persistent CDN URL
      setPreview(publicUrl);
      onUploaded(publicUrl);
      toast.success("Image saved");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
      // Revert preview to the last known good URL
      setPreview(currentUrl);
    } finally {
      setUploading(false);
      // Clean up the blob URL
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
      // Reset the input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setPreview(undefined);
    onCleared();
  };

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>

      <label
        className={[
          "relative block w-full rounded-2xl border-2 border-dashed bg-muted overflow-hidden",
          "cursor-pointer transition-colors",
          uploading
            ? "border-primary/30 pointer-events-none"
            : "border-border hover:border-primary/40",
          aspect,
        ].join(" ")}
      >
        {/* Image preview */}
        {preview && (
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        )}

        {/* Empty state */}
        {!preview && !uploading && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">Click to upload</span>
          </span>
        )}

        {/* Upload overlay */}
        {uploading && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <span className="text-xs text-white/80">Uploading…</span>
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>

      {preview && !uploading && (
        <button
          onClick={handleClear}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      )}
    </div>
  );
}
