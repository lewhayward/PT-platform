// The two kinds of accounts in the app. Kept as a union type (rather than a
// class or enum) so it matches the Postgres enum in supabase/schema.sql.
export type UserRole = "trainer" | "client";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}
