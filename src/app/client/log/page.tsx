import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { LogWorkoutForm } from "@/components/log-workout-form";
import { getTodayDayOfWeek } from "@/lib/types";

export default async function LogWorkoutPage() {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: programme } = await supabase
    .from("programmes")
    .select("id")
    .eq("client_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!programme) {
    redirect("/client");
  }

  const today = getTodayDayOfWeek();

  const { data: day } = await supabase
    .from("programme_days")
    .select("id, name, is_rest")
    .eq("programme_id", programme.id)
    .eq("day_of_week", today)
    .single();

  const { data: exercises } = day
    ? await supabase
        .from("programme_exercises")
        .select(
          "id, exercise_id, custom_name, sets, reps, weight, order_index"
        )
        .eq("programme_day_id", day.id)
        .order("order_index")
    : { data: [] };

  if (!day || day.is_rest || !exercises || exercises.length === 0) {
    redirect("/client");
  }

  const exerciseIds = [
    ...new Set(exercises.map((e) => e.exercise_id).filter(Boolean)),
  ] as string[];

  const { data: libraryExercises } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
      : { data: [] };
  const nameById = new Map(libraryExercises?.map((e) => [e.id, e.name]));

  // If they've already logged today, pre-fill with what they logged instead
  // of the prescribed defaults, so editing shows what actually happened.
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: existingLog } = await supabase
    .from("workout_logs")
    .select("id, notes")
    .eq("programme_day_id", day.id)
    .eq("logged_date", todayIso)
    .maybeSingle();

  const { data: existingLogExercises } = existingLog
    ? await supabase
        .from("workout_log_exercises")
        .select("id, exercise_id, custom_name, order_index")
        .eq("workout_log_id", existingLog.id)
        .order("order_index")
    : { data: [] };

  const logExerciseIds = (existingLogExercises ?? []).map((le) => le.id);
  const { data: existingSets } =
    logExerciseIds.length > 0
      ? await supabase
          .from("workout_log_sets")
          .select("workout_log_exercise_id, set_number, reps_completed, weight_used")
          .in("workout_log_exercise_id", logExerciseIds)
      : { data: [] };

  const setsByLogExerciseId = new Map<string, typeof existingSets>();
  for (const set of existingSets ?? []) {
    const list = setsByLogExerciseId.get(set.workout_log_exercise_id) ?? [];
    list.push(set);
    setsByLogExerciseId.set(set.workout_log_exercise_id, list);
  }

  // Match previous log entries back to today's prescribed exercises by
  // exercise identity (id or custom name) - the programme may have been
  // edited since, so positions alone can't be trusted. Also tracks WHICH
  // occurrence of a repeated exercise (e.g. the same lift prescribed twice
  // in one day) each entry was, so duplicates don't all collapse onto the
  // last one.
  function occurrenceKey(identity: string, occurrence: number) {
    return `${identity}::${occurrence}`;
  }

  const previousSetsByOccurrence = new Map<string, typeof existingSets>();
  const previousOccurrenceCounts = new Map<string, number>();
  for (const le of existingLogExercises ?? []) {
    const identity = le.exercise_id ?? le.custom_name ?? "";
    const occurrence = previousOccurrenceCounts.get(identity) ?? 0;
    previousOccurrenceCounts.set(identity, occurrence + 1);
    previousSetsByOccurrence.set(
      occurrenceKey(identity, occurrence),
      setsByLogExerciseId.get(le.id) ?? []
    );
  }

  const occurrenceCounts = new Map<string, number>();
  const formExercises = exercises.map((exercise) => {
    const identity = exercise.exercise_id ?? exercise.custom_name ?? "";
    const occurrence = occurrenceCounts.get(identity) ?? 0;
    occurrenceCounts.set(identity, occurrence + 1);
    const previousSets =
      previousSetsByOccurrence.get(occurrenceKey(identity, occurrence)) ?? [];

    return {
      id: exercise.id,
      name: exercise.exercise_id
        ? nameById.get(exercise.exercise_id) ?? "Exercise"
        : exercise.custom_name ?? "Exercise",
      prescribedSets: exercise.sets,
      prescribedReps: exercise.reps,
      prescribedWeight: exercise.weight,
      sets: Array.from({ length: exercise.sets }, (_, i) => {
        const previous = previousSets.find((s) => s.set_number === i + 1);
        return {
          setNumber: i + 1,
          reps: previous?.reps_completed ?? null,
          weight: previous?.weight_used ?? exercise.weight ?? "",
        };
      }),
    };
  });

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">
        {day.name ?? "Today's workout"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Adjust anything you did differently, then save.
      </p>

      <LogWorkoutForm
        exercises={formExercises}
        defaultNotes={existingLog?.notes ?? ""}
      />
    </div>
  );
}
