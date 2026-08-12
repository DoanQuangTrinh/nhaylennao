import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/content")({
  component: ContentIndex,
  head: () => ({
    meta: [{ title: "Global EN Content Pack · QuanBar" }],
  }),
});

const DOCS = [
  { slug: "BRAND", title: "Brand voice", desc: "Neon Club Live + Savage Fortune rules" },
  { slug: "STREAM_TITLES", title: "Stream titles", desc: "30+ EN titles for Club & Fortune" },
  { slug: "THUMBNAIL_TEXT", title: "Thumbnail text", desc: "Short overlay texts for thumbs" },
  { slug: "HOST_SCRIPTS", title: "Host scripts", desc: "0-viewer to 60-min rundowns" },
  { slug: "CHAT_GAMES", title: "Chat games", desc: "Mini-games with existing commands" },
  { slug: "SHORTS_PIPELINE", title: "Shorts pipeline", desc: "12–25s clip system" },
  { slug: "POSTING_CALENDAR_14_DAYS", title: "14-day calendar", desc: "Live slots + 3 shorts/day" },
  { slug: "PLATFORM_PLAYBOOK", title: "Platform playbook", desc: "TikTok-first growth" },
  { slug: "OBS_SETUP_GLOBAL", title: "OBS setup", desc: "International presentation" },
  { slug: "PINNED_AND_BIO", title: "Pinned & bio", desc: "Bio, about, end-screen CTA" },
];

function ContentIndex() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to host panel
          </Link>
        </Button>
        <div className="panel-card neon-border p-6">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-accent">
            content/global-en
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-fg sm:text-3xl">
            Global EN Live Pack
          </h1>
          <p className="mt-2 text-sm text-muted">
            Operator-ready scripts, titles, calendar, and OBS setup for overseas
            English livestreams. Files also live on disk under content/global-en/.
          </p>
        </div>
        <ul className="mt-6 space-y-2">
          {DOCS.map((d) => (
            <li key={d.slug}>
              <Link
                to="/content/$slug"
                params={{ slug: d.slug }}
                className="panel-card flex items-start gap-3 p-4 transition-colors hover:border-accent/40"
              >
                <FileText className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold text-fg">{d.title}</p>
                  <p className="text-xs text-muted">{d.desc}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-center gap-2 text-xs text-muted">
          <BookOpen className="size-3.5" />
          Tip: open these on a second screen while live.
        </p>
      </div>
    </main>
  );
}
