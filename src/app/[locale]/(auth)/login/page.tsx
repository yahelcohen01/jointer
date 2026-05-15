import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const t = await getTranslations("Auth.login");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <LoginForm />
    </div>
  );
}
