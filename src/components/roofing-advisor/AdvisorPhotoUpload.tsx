"use client";

import { Camera, ImagePlus } from "lucide-react";
import { type ChangeEvent, useId } from "react";
import { cn } from "@/lib/cn";

interface AdvisorPhotoUploadProps {
  onPhotos: (files: File[]) => void;
  disabled?: boolean;
  /** "inline" answers a photo request in the conversation; "icon" sits in the composer. */
  variant: "inline" | "icon";
}

/** Opens the camera or photo library. Photos are optional: the chat never waits on them. */
export function AdvisorPhotoUpload({ onPhotos, disabled = false, variant }: AdvisorPhotoUploadProps) {
  const id = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset so picking the same photo again still counts.
    event.target.value = "";
    if (files.length > 0) onPhotos(files);
  }

  return (
    <>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={handleChange}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={cn(
          "cursor-pointer transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          variant === "inline"
            ? "inline-flex h-11 w-fit items-center gap-2 rounded-full border border-brand bg-canvas px-4 text-sm font-semibold text-brand hover:bg-brand-soft"
            : "flex size-10 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-brand",
        )}
      >
        {variant === "inline" ? (
          <>
            <Camera aria-hidden="true" className="size-4" />
            Add a photo
          </>
        ) : (
          <>
            <ImagePlus aria-hidden="true" className="size-5" />
            <span className="sr-only">Add roof photos</span>
          </>
        )}
      </label>
    </>
  );
}
