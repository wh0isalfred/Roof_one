import { ImageIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROJECTS } from "@/content/home";

/** Stand-in for a project photo until real images are added with next/image. */
function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative flex aspect-4/5 items-center justify-center bg-subtle">
      <ImageIcon aria-hidden="true" className="size-6 text-control" />
      <span className="absolute bottom-2 left-2 rounded-sm bg-surface px-2 py-1 text-xs font-semibold">
        {label}
      </span>
    </div>
  );
}

export function ProjectsSection() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="scroll-mt-4 border-y border-line bg-surface"
    >
      <Container className="py-20 lg:py-28">
        <SectionHeading
          id="projects-heading"
          eyebrow="Projects"
          title="Before and after."
        />
        <ul className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {PROJECTS.map((project) => (
            <li key={project.title}>
              <figure>
                <div className="grid grid-cols-2 gap-1.5">
                  <PhotoPlaceholder label="Before" />
                  <PhotoPlaceholder label="After" />
                </div>
                <figcaption className="mt-4">
                  <p className="text-xs font-semibold tracking-eyebrow text-accent uppercase">
                    {project.category}
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {project.summary}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
