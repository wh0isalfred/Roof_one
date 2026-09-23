import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: `Admin · ${siteConfig.name}`,
    template: `%s · Admin · ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

/**
 * Internal lead-management product, separate from the public site.
 * Supabase Auth protects this boundary in the next stage; until then it only
 * shows placeholder data.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:gap-8 lg:px-4 lg:py-6">
          <div className="flex items-baseline gap-2 px-3">
            <Link
              href="/admin"
              className="font-display text-lg font-extrabold tracking-wide uppercase"
            >
              {siteConfig.name}
            </Link>
            <span className="text-xs font-semibold tracking-eyebrow text-ink-muted uppercase">
              Admin
            </span>
          </div>
          <AdminNav />
        </div>
      </aside>

      <main id="main" className="min-w-0">
        <p className="border-b border-line bg-accent-soft px-4 py-2 text-sm text-accent-strong sm:px-6 lg:px-10">
          Placeholder data. Sign-in and the Supabase connection come next.
        </p>
        <div className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
