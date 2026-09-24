import Image from "next/image";
import heroImage from "@/assets/heroImage.jpg";
import { cn } from "@/lib/cn";

/**
 * The site's roofing photography with the navy grade used across the page.
 * Every slot uses the one supplied photo for now; `crop` frames a different
 * part of it. Swap `src` per slot once more photography is available.
 */
export function RoofPhoto({
  crop,
  tone = "strong",
  priority = false,
  sizes,
  className,
}: {
  /** Tailwind classes that frame the image, e.g. object position and scale. */
  crop?: string;
  tone?: "strong" | "soft";
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("absolute inset-0 overflow-hidden bg-brand-strong", className)}>
      <Image
        src={heroImage}
        alt=""
        fill
        priority={priority}
        placeholder="blur"
        sizes={sizes}
        className={cn(
          "object-cover grayscale-[20%] transition-transform duration-700 ease-out motion-reduce:transition-none",
          crop,
        )}
      />
      <div
        className={cn(
          "absolute inset-0 bg-brand-strong mix-blend-multiply",
          tone === "strong" ? "opacity-70" : "opacity-50",
        )}
      />
      <div className={cn("absolute inset-0 bg-ink", tone === "strong" ? "opacity-20" : "opacity-10")} />
    </div>
  );
}
