import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <main id="main">
      <Container className="flex min-h-svh flex-col justify-center py-20">
        <p className="text-sm font-medium text-ink-muted">404</p>
        <h1 className="font-headline mt-3 text-4xl leading-[1.05] sm:text-5xl">
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
