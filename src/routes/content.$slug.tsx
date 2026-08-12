import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contentDocs } from "@/lib/content/global-en-docs";

export const Route = createFileRoute("/content/$slug")({
  component: ContentDocPage,
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} · Global EN Pack` }],
  }),
});

function ContentDocPage() {
  const { slug } = Route.useParams();
  const doc = contentDocs[slug];

  if (!doc) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-fg">Doc not found: {slug}</p>
        <Button className="mt-4" asChild>
          <Link to="/content">All docs</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/content">
            <ArrowLeft className="size-4" />
            All docs
          </Link>
        </Button>
        <article className="panel-card p-6 sm:p-8">
          <p className="font-display text-[10px] uppercase tracking-widest text-accent">
            content/global-en/{slug}.md
          </p>
          <div className="prose-neon mt-4 space-y-3 text-sm leading-relaxed text-fg">
            {doc.split("\n").map((line, i) => {
              if (line.startsWith("# "))
                return (
                  <h1 key={i} className="font-display text-2xl font-bold text-fg">
                    {line.slice(2)}
                  </h1>
                );
              if (line.startsWith("## "))
                return (
                  <h2
                    key={i}
                    className="mt-6 font-display text-lg font-semibold text-accent"
                  >
                    {line.slice(3)}
                  </h2>
                );
              if (line.startsWith("### "))
                return (
                  <h3 key={i} className="mt-4 text-base font-semibold text-fg">
                    {line.slice(4)}
                  </h3>
                );
              if (line.startsWith("- "))
                return (
                  <li key={i} className="ml-4 list-disc text-muted marker:text-accent">
                    <span className="text-fg">{line.slice(2)}</span>
                  </li>
                );
              if (line.startsWith("|"))
                return (
                  <pre
                    key={i}
                    className="overflow-x-auto font-mono text-[11px] text-muted"
                  >
                    {line}
                  </pre>
                );
              if (line.trim() === "") return <div key={i} className="h-2" />;
              if (line.startsWith("```"))
                return (
                  <div key={i} className="text-[10px] uppercase tracking-wider text-muted">
                    {line}
                  </div>
                );
              return (
                <p key={i} className="text-muted">
                  <span className="text-fg/90">{line}</span>
                </p>
              );
            })}
          </div>
        </article>
      </div>
    </main>
  );
}
