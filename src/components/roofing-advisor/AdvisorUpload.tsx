import { ImagePlus, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { buttonStyles } from "@/components/ui/Button";

interface AdvisorUploadProps {
  id: string;
  files: readonly File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

/**
 * Photo picker. Files stay in the browser for now; uploading to Supabase
 * Storage happens when lead creation is connected.
 */
export function AdvisorUpload({
  id,
  files,
  onChange,
  maxFiles = 8,
}: AdvisorUploadProps) {
  const isFull = files.length >= maxFiles;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    onChange([...files, ...selected].slice(0, maxFiles));
    // Reset so choosing the same photo again still fires a change.
    event.target.value = "";
  }

  return (
    <div>
      <div className="rounded-md border border-dashed border-control bg-canvas px-5 py-8 text-center">
        <input
          id={id}
          type="file"
          accept="image/*"
          multiple
          disabled={isFull}
          onChange={handleChange}
          className="peer sr-only"
        />
        <label
          htmlFor={id}
          className={buttonStyles({
            variant: "outline",
            className:
              "cursor-pointer bg-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          })}
        >
          <ImagePlus aria-hidden="true" className="size-4" />
          Add photos
        </label>
        <p className="mt-3 text-sm text-ink-muted">
          Up to {maxFiles} photos. Take new ones or choose from your library.
        </p>
      </div>

      {files.length > 0 && (
        <ul
          aria-label="Selected photos"
          className="mt-4 divide-y divide-line border-t border-line"
        >
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="flex size-10 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-subtle hover:text-ink"
              >
                <X aria-hidden="true" className="size-4" />
                <span className="sr-only">Remove {file.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
