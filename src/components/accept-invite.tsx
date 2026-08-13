"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth-card";
import { SetPasswordForm } from "@/components/set-password-form";

// Supabase invite links can't use the same server-side link-handling as
// sign-up confirmation links: the session tokens arrive in the URL
// "fragment" (the part after #), which browsers never send to a server -
// only JavaScript running on the page can read it. So this runs client-side:
// pick up the tokens from the address bar, exchange them for a real
// session, then show the "set your password" form.
export function AcceptInvite() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const hash = window.location.hash;
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          // Tidy the address bar - these tokens shouldn't linger in the URL.
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setReady(true);
      } else {
        router.replace("/login");
      }
    }

    establishSession();
  }, [router]);

  return (
    <AuthCard
      title="Set your password"
      subtitle="Your trainer has invited you - choose a password to activate your account."
    >
      {ready ? (
        <SetPasswordForm />
      ) : (
        <p className="text-center text-sm text-muted">One moment…</p>
      )}
    </AuthCard>
  );
}
