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

// Matches public.client_goal in supabase/schema.sql. Used to suggest a
// starting programme template for a client (see programme_templates).
export type ClientGoal =
  | "bodybuilding"
  | "fat_loss"
  | "general_fitness"
  | "strength";

export const CLIENT_GOAL_LABELS: Record<ClientGoal, string> = {
  bodybuilding: "Bodybuilding",
  fat_loss: "Fat loss",
  general_fitness: "General fitness",
  strength: "Strength",
};

export interface TrainerClient {
  id: string;
  trainer_id: string;
  client_id: string;
  email: string;
  goals: string | null;
  notes: string | null;
  goal: ClientGoal | null;
  days_per_week: number | null;
  status: TrainerClientStatus;
  created_at: string;
}

// Matches public.day_of_week in supabase/schema.sql.
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

// getUTCDay() returns 0 (Sunday) through 6 (Saturday). Deliberately UTC,
// not local server time: `logged_date` elsewhere is derived from
// toISOString() (always UTC), and this must agree with that or a workout
// logged near midnight could be stamped with the wrong day.
const JS_DAY_TO_ENUM: DayOfWeek[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function getTodayDayOfWeek(): DayOfWeek {
  return JS_DAY_TO_ENUM[new Date().getUTCDay()];
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "core"
  | "cardio"
  | "full_body";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
  core: "Core",
  cardio: "Cardio",
  full_body: "Full body",
};

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: string | null;
}

export interface ProgrammeExercise {
  id: string;
  programme_day_id: string;
  exercise_id: string | null;
  custom_name: string | null;
  sets: number;
  reps: string;
  weight: string | null;
  notes: string | null;
  order_index: number;
  exercise?: Exercise | null;
}

export interface ProgrammeDay {
  id: string;
  programme_id: string;
  day_of_week: DayOfWeek;
  name: string | null;
  is_rest: boolean;
}

export interface Programme {
  id: string;
  trainer_id: string;
  client_id: string;
  name: string;
}

export interface ProgrammeTemplate {
  id: string;
  name: string;
  goal: ClientGoal;
  days_per_week: number;
  description: string | null;
}

export interface WorkoutLogSet {
  id: string;
  workout_log_exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_used: string | null;
}

export interface WorkoutLogExercise {
  id: string;
  workout_log_id: string;
  exercise_id: string | null;
  custom_name: string | null;
  prescribed_sets: number | null;
  prescribed_reps: string | null;
  prescribed_weight: string | null;
  order_index: number;
  exercise?: Exercise | null;
  sets: WorkoutLogSet[];
}

export interface WorkoutLog {
  id: string;
  programme_day_id: string;
  client_id: string;
  day_name: string | null;
  logged_date: string;
  notes: string | null;
}
