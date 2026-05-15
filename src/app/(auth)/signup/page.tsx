import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold font-display">הרשמה</h1>
        <p className="text-sm text-muted-foreground">צרו את החשבון שלכם בכמה שניות.</p>
      </header>
      <SignupForm />
    </div>
  );
}
