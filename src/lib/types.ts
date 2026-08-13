// The two kinds of accounts in the app. Kept as a union type (rather than a
// class or enum) so it matches the Postgres enum in supabase/schema.sql.
export type UserRole = "trainer" | "client";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export type TrainerClientStatus = "invited" | "active";

export interface TrainerClient {
  id: string;
  trainer_id: string;
  client_id: string;
  email: string;
  goals: string | null;
  notes: string | null;
  status: TrainerClientStatus;
  created_at: string;
}
