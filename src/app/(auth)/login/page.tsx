import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm flex-1 px-4 py-16 flex flex-col gap-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold font-display">התחברות</h1>
        <p className="text-sm text-muted-foreground">היכנסו עם Google או בקישור קסם לאימייל</p>
      </header>
      <LoginForm />
    </main>
  );
}
