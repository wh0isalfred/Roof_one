import { Container } from "@/components/ui/Container";

const projects = [
  {
    id: 1,
    title: "Full Roof Replacement",
    type: "Residential",
    location: "Brooklyn, NY",
    image: "https://images.unsplash.com/photo-1541695490-f720a9cea960?w=600&q=80",
  },
  {
    id: 2,
    title: "Storm Damage Restoration",
    type: "Residential",
    location: "Manhattan, NY",
    image: "https://images.unsplash.com/photo-1504917595217-340976efaaea?w=600&q=80",
  },
  {
    id: 3,
    title: "Chimney Leak Repair",
    type: "Repair",
    location: "Queens, NY",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  },
  {
    id: 4,
    title: "Complete Restoration",
    type: "Residential",
    location: "Bronx, NY",
    image: "https://images.unsplash.com/photo-1574015848222-37f6ff6b2f92?w=600&q=80",
  },
];

export function ProjectsSection() {
  const featuredProject = projects[0];
  const otherProjects = projects.slice(1);

  return (
    <section className="py-20 lg:py-28 bg-subtle">
      <Container className="max-w-6xl">
        <div className="mb-16 lg:mb-20">
          <h2 className="text-4xl lg:text-5xl font-semibold text-ink mb-6">
            Our work
          </h2>
          <p className="text-lg text-ink-muted max-w-2xl">
            Real roofing solutions for real homeowners. Here's some of our recent projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Large featured project */}
          {featuredProject && (
            <div className="md:col-span-2 lg:col-span-2 lg:row-span-2">
              <div className="h-96 lg:h-full rounded-xl overflow-hidden group cursor-pointer">
                <img
                  src={featuredProject.image}
                  alt={featuredProject.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-2xl font-semibold text-ink mt-4">
                {featuredProject.title}
              </h3>
              <div className="flex gap-4 text-sm text-ink-muted mt-2">
                <span>{featuredProject.type}</span>
                <span>•</span>
                <span>{featuredProject.location}</span>
              </div>
            </div>
          )}

          {/* Smaller projects */}
          {otherProjects.map((project) => (
            <div key={project.id} className="group cursor-pointer">
              <div className="h-56 rounded-lg overflow-hidden mb-4">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-semibold text-ink text-lg group-hover:text-brand transition-colors">
                {project.title}
              </h3>
              <div className="flex gap-3 text-sm text-ink-muted mt-2">
                <span>{project.type}</span>
                <span>•</span>
                <span>{project.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
