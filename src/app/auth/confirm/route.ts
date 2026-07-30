import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

// Supabase sends people here after they click the "Confirm your email" link
// (see emailRedirectTo in src/app/auth/actions.ts). By default the link
// carries a `code` param (Supabase verifies it, then redirects here) - we
// exchange that code for a real session. `token_hash`/`type` are also
// handled in case the Supabase email template is later customised to link
// here directly instead.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing confirmation code") };

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=confirmation-failed`
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = userData.user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single()
    : { data: null };

  const destination = profile?.role === "trainer" ? "/trainer" : "/client";
  return NextResponse.redirect(`${origin}${destination}`);
}
