import { Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MoreLink, SectionHeading } from "@/components/ui/SectionHeading";
import { SAMPLE_REVIEWS, SAMPLE_REVIEWS_INTRO } from "@/content/sample";

export function ReviewsSection() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className="scroll-mt-16 bg-canvas pt-20 pb-12 lg:pt-24 lg:pb-14"
    >
      <Container className="max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              id="reviews-title"
              eyebrow="Real stories"
              title="Homeowners Trust Roof One"
              description={SAMPLE_REVIEWS_INTRO}
            />
            <MoreLink href="/#reviews">Read More Reviews</MoreLink>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {SAMPLE_REVIEWS.map((review) => (
              <li key={review.name}>
                <figure className="flex h-full flex-col rounded-lg border border-line bg-canvas p-6 shadow-overlay">
                  <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand"
                  >
                    {review.initials}
                  </span>
                  <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-ink-muted">
                    “{review.quote}”
                  </blockquote>
                  <figcaption className="mt-5">
                    <span className="text-sm font-semibold">{review.name}</span>
                    <span
                      role="img"
                      aria-label={`${review.rating} out of 5 stars`}
                      className="mt-1.5 flex gap-0.5 text-accent"
                    >
                      {Array.from({ length: review.rating }, (_, i) => (
                        <Star key={i} aria-hidden="true" className="size-4 fill-current" />
                      ))}
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
