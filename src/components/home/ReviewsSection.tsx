import { Star } from "lucide-react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SAMPLE_REVIEWS } from "@/content/sample";

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="scroll-mt-16 bg-canvas py-20 sm:py-24 lg:py-28"
    >
      <Container className="max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.2fr)] lg:gap-20">
          <SectionHeading
            id="reviews-title"
            title="In their words"
            description="What a couple of recent customers told us after the job was done."
          />

          <ul className="grid gap-12 sm:grid-cols-2 sm:gap-10">
            {SAMPLE_REVIEWS.map((review) => (
              <li key={review.name}>
                <figure className="flex h-full flex-col border-t border-ink pt-6">
                  <span
                    role="img"
                    aria-label={`${review.rating} out of 5 stars`}
                    className="flex gap-0.5 text-brand"
                  >
                    {Array.from({ length: review.rating }, (_, i) => (
                      <Star key={i} aria-hidden="true" className="size-4 fill-current" />
                    ))}
                  </span>
                  <blockquote className="mt-5 flex-1 text-lg leading-relaxed">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-7 flex items-center gap-3">
                    <Image
                      src={review.photo}
                      alt=""
                      sizes="44px"
                      className="size-11 rounded-full object-cover object-[50%_30%]"
                    />
                    <span className="text-sm leading-tight">
                      <span className="block font-semibold">{review.name}</span>
                      <span className="text-ink-muted">{review.detail}</span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
