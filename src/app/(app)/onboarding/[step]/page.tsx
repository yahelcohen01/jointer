// Phase 1 / Slice 3 placeholder — Slice 4 (#6) implements username step,
// Slice 5 (#7) implements niche + theme steps. The proxy already gates this
// route, so visitors here are guaranteed to have a session.

interface Props {
  params: Promise<{ step: string }>;
}

export default async function OnboardingStepPage({ params }: Props) {
  const { step } = await params;
  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-16 flex flex-col items-center text-center gap-3">
      <h1 className="text-3xl font-bold font-display">הקליטה</h1>
      <p className="text-muted-foreground">שלב: {step}</p>
      <p className="text-sm text-muted-foreground">הזרימה האמיתית תוטמע בפרוסות 4–5.</p>
    </main>
  );
}
