import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=no_user", url.origin));
  }

  // Ensure a profile row exists. Slice 4 will let the user claim a real username
  // (the placeholder below will be replaced by their choice).
  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    const localPart = (user.email ?? "user").split("@")[0];
    const initialUsername = `user_${user.id.slice(0, 8)}`;
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: initialUsername,
      display_name: localPart,
    });
    if (insertError) {
      return NextResponse.redirect(new URL("/login?error=profile_create_failed", url.origin));
    }
  }

  // Honour ?next= if present and same-origin, otherwise route based on onboarding state.
  if (next?.startsWith("/")) {
    return NextResponse.redirect(new URL(next, url.origin));
  }
  if (!existing?.onboarded_at) {
    return NextResponse.redirect(new URL("/onboarding/username", url.origin));
  }
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
