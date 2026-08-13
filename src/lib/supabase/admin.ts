import "server-only";
import { createClient } from "@supabase/supabase-js";

// This client uses the SECRET key, which bypasses every Row Level Security
// rule and can manage any user in the project. It must never be imported
// into a Client Component or sent to the browser - the "server-only" import
// above makes the build fail if that ever happens by mistake.
//
// Only use this for things a trainer's own account genuinely can't do, like
// inviteUserByEmail() below. Everything else should go through the regular
// server client (src/lib/supabase/server.ts), which respects RLS.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
