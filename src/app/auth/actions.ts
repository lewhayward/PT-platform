"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LoginSchema,
  SignupSchema,
  type LoginFormState,
  type SignupFormState,
} from "@/lib/definitions";

// Works out the base URL of the running app (e.g. https://my-app.com), so
// Supabase knows where to send people after they click the "confirm your
// email" link. Falls back to the request's own origin in development.
async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const origin = (await headers()).get("origin");
  return origin ?? "http://localhost:3000";
}

export async function signup(
  _state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validated = SignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { fullName, email, password, role } = validated.data;
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Stored on auth.users.raw_user_meta_data - the database trigger in
      // supabase/schema.sql copies these into our own `profiles` table.
      data: { full_name: fullName, role },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  });

  if (error) {
    return { message: error.message };
  }

  // If the Supabase project has email confirmation turned off, `signUp`
  // signs the person in immediately and returns a session. Otherwise they
  // need to click the link in their inbox first.
  if (data.session) {
    redirect(role === "trainer" ? "/trainer" : "/client");
  }

  redirect("/signup/check-email");
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(
    validated.data
  );

  if (error) {
    return { message: "Incorrect email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.role === "trainer" ? "/trainer" : "/client");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
