import Link from "next/link";

// Phase 1 / Slice 1 — minimal placeholder.
// Slice 2 replaces this with proper /he and /en routes via next-intl.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-24 flex flex-col items-center text-center gap-6">
      <h1 className="text-5xl font-bold font-display">Jointer</h1>
      <p className="text-xl text-muted-foreground max-w-md">
        קישור אחד לכל מה שאתם עושים. עברית מההתחלה, ביט וביטוקס מובנים.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
      >
        התחילו
      </Link>
    </main>
  );
}
