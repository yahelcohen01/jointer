// Phase 1 / Slice 1 — placeholder. Slice 3 (issue #5) makes this a protected
// route reading the signed-in user's profile. Slices 4+ add the real dashboard.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-24 flex flex-col items-center text-center gap-4">
      <h1 className="text-3xl font-bold font-display">הדשבורד</h1>
      <p className="text-muted-foreground">בקרוב — לאחר השלמת ההזדהות בפרוסה 3.</p>
    </main>
  );
}
