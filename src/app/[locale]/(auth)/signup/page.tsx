import { getTranslations } from "next-intl/server";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const t = await getTranslations("Auth.signup");
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <SignupForm />
    </div>
  );
}
