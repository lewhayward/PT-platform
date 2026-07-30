import { createBrowserClient } from "@supabase/ssr";

// Use this client inside Client Components (files with "use client").
// It reads/writes the Supabase auth cookies directly in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
