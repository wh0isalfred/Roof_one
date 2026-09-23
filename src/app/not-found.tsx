import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";

export default function NotFound() {
  return (
    <main id="main">
      <Container className="flex min-h-svh flex-col justify-center py-20">
        <Eyebrow>Page not found</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          We couldn’t find that page.
        </h1>
        <p className="mt-4 max-w-md text-lg text-ink-muted">
          The link may be old, or the page may have moved.
        </p>
        <ButtonLink href="/" className="mt-8 self-start">
          Back to home
        </ButtonLink>
      </Container>
    </main>
  );
}
