import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { REVIEWS } from "@/content/home";

export function ReviewsSection() {
  return (
    <section aria-labelledby="reviews-heading">
      <Container className="py-20 lg:py-28">
        <SectionHeading
          id="reviews-heading"
          eyebrow="Reviews"
          title="What homeowners say."
        />
        <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {REVIEWS.map((review) => (
            <li key={review.id}>
              <figure className="flex h-full flex-col border-t-2 border-accent pt-6">
                <blockquote className="text-lg text-pretty">
                  <p>“{review.quote}”</p>
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-semibold">{review.author}</span>
                  <span className="text-ink-muted"> · {review.context}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
