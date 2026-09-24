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
      className="scroll-mt-16 bg-canvas pt-20 pb-12 lg:pt-28 lg:pb-16"
    >
      <Container className="max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.2fr] lg:gap-16">
          <SectionHeading
            id="reviews-title"
            title="In their words"
            description="What a couple of recent customers told us after the job was done."
          />

          <ul className="grid gap-5 sm:grid-cols-2">
            {SAMPLE_REVIEWS.map((review) => (
              <li key={review.name}>
                <figure className="flex h-full flex-col rounded-lg border border-line bg-canvas p-6 shadow-overlay">
                  <span
                    role="img"
                    aria-label={`${review.rating} out of 5 stars`}
                    className="flex gap-0.5 text-accent"
                  >
                    {Array.from({ length: review.rating }, (_, i) => (
                      <Star key={i} aria-hidden="true" className="size-4 fill-current" />
                    ))}
                  </span>
                  <blockquote className="mt-4 flex-1 leading-relaxed">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
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
