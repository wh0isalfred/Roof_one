import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LeadNotFound() {
  return (
    <div className="border border-dashed border-control px-6 py-12 text-center">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Lead not found
      </h1>
      <p className="mt-2 text-ink-muted">
        It may have been deleted, or the link is wrong.
      </p>
      <Link
        href="/admin/leads"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All leads
      </Link>
    </div>
  );
}
