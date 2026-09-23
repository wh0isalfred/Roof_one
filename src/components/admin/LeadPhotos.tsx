import { ImageIcon } from "lucide-react";
import type { LeadPhoto } from "@/lib/leads/types";

/**
 * Photo grid. Shows file names for now; thumbnails come from Supabase Storage
 * signed URLs (rendered with next/image) once storage is connected.
 */
export function LeadPhotos({ photos }: { photos: readonly LeadPhoto[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-ink-muted">No photos uploaded.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.id}>
          <div className="flex aspect-4/3 items-center justify-center bg-subtle">
            <ImageIcon aria-hidden="true" className="size-6 text-control" />
          </div>
          <p className="mt-1.5 truncate text-xs text-ink-muted">
            {photo.storage_path.split("/").pop()}
          </p>
        </li>
      ))}
    </ul>
  );
}
