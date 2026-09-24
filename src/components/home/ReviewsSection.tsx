import { Container } from "@/components/ui/Container";
import { Star, ShieldCheck } from "lucide-react";

export function ReviewsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <Container className="max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Rating */}
          <div>
            <div className="flex mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-4xl font-bold text-ink mb-1">4.9</p>
            <p className="text-ink-muted">Google Reviews</p>
          </div>

          {/* Homes Protected */}
          <div>
            <p className="text-4xl font-bold text-ink mb-1">2,400+</p>
            <p className="text-ink-muted">Homes Protected</p>
          </div>

          {/* Experience */}
          <div>
            <p className="text-4xl font-bold text-ink mb-1">15+</p>
            <p className="text-ink-muted">Years Experience</p>
          </div>

          {/* Licensed */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-brand" />
              <span className="text-lg font-semibold text-ink">Licensed</span>
            </div>
            <p className="text-ink-muted">& Insured</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
