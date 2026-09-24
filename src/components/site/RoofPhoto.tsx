import Image, { type StaticImageData } from "next/image";
import heroImage from "@/assets/heroImage.jpg";
import { cn } from "@/lib/cn";

/** Roofing photography with the navy grade used across the page. */
export function RoofPhoto({
  src = heroImage,
  crop,
  tone = "strong",
  sizes,
  className,
}: {
  src?: StaticImageData;
  /** Tailwind classes that frame the image, e.g. object position and scale. */
  crop?: string;
  tone?: "strong" | "soft";
  sizes: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("absolute inset-0 overflow-hidden bg-brand-strong", className)}>
      <Image
        src={src}
        alt=""
        fill
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
