import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

// The Data Access Layer: every server-side check for "who is logged in and
// what can they see" goes through here, instead of being duplicated across
// pages. `cache()` means multiple calls during one request only hit
// Supabase once.
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, created_at")
    .eq("id", userData.user.id)
    .single();

  return profile;
});

// Call this at the top of a protected page/layout. Redirects to /login if
// nobody is signed in, or to the user's own dashboard if they're signed in
// as the wrong role (e.g. a client trying to view /trainer).
export async function requireProfile(role?: UserRole): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (role && profile.role !== role) {
    redirect(profile.role === "trainer" ? "/trainer" : "/client");
  }

  return profile;
}
