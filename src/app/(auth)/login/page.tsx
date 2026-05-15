import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold font-display">התחברות</h1>
        <p className="text-sm text-muted-foreground">חזרתם! היכנסו עם המייל והסיסמה.</p>
      </header>
      <LoginForm />
    </div>
  );
}
