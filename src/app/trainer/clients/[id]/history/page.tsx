import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function WorkoutHistoryPage(
  props: PageProps<"/trainer/clients/[id]/history">
) {
  await requireProfile("trainer");
  const { id: trainerClientId } = await props.params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, client_id, email")
    .eq("id", trainerClientId)
    .single();

  if (!client) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", client.client_id)
    .single();

  const clientName = profile?.full_name ?? client.email;

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id, day_name, logged_date, notes")
    .eq("client_id", client.client_id)
    .order("logged_date", { ascending: false })
    .limit(30);

  const logIds = logs?.map((l) => l.id) ?? [];

  const { data: logExercises } =
    logIds.length > 0
      ? await supabase
          .from("workout_log_exercises")
          .select(
            "id, workout_log_id, exercise_id, custom_name, prescribed_sets, prescribed_reps, prescribed_weight, order_index"
          )
          .in("workout_log_id", logIds)
          .order("order_index")
      : { data: [] };

  const logExerciseIds = logExercises?.map((e) => e.id) ?? [];

  const { data: logSets } =
    logExerciseIds.length > 0
      ? await supabase
          .from("workout_log_sets")
          .select("workout_log_exercise_id, set_number, reps_completed, weight_used")
          .in("workout_log_exercise_id", logExerciseIds)
          .order("set_number")
      : { data: [] };

  const exerciseIds = [
    ...new Set((logExercises ?? []).map((e) => e.exercise_id).filter(Boolean)),
  ] as string[];

  const { data: libraryExercises } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
      : { data: [] };
  const nameById = new Map(libraryExercises?.map((e) => [e.id, e.name]));

  const setsByExerciseId = new Map<string, typeof logSets>();
  for (const set of logSets ?? []) {
    const list = setsByExerciseId.get(set.workout_log_exercise_id) ?? [];
    list.push(set);
    setsByExerciseId.set(set.workout_log_exercise_id, list);
  }

  const exercisesByLogId = new Map<string, typeof logExercises>();
  for (const exercise of logExercises ?? []) {
    const list = exercisesByLogId.get(exercise.workout_log_id) ?? [];
    list.push(exercise);
    exercisesByLogId.set(exercise.workout_log_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {clientName}&apos;s workout history
        </h2>
        <Link
          href={`/trainer/clients/${trainerClientId}`}
          className="text-sm text-accent"
        >
          Back to profile
        </Link>
      </div>

      {!logs || logs.length === 0 ? (
        <Card className="mt-6 text-center">
          <p className="text-muted">No workouts logged yet.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {logs.map((log) => {
            const exercises = exercisesByLogId.get(log.id) ?? [];
            return (
              <Card key={log.id}>
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-foreground">
                    {log.day_name ?? "Workout"}
                  </p>
                  <p className="text-sm text-muted">
                    {new Date(log.logged_date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>

                <ul className="mt-3 flex flex-col gap-2">
                  {exercises.map((exercise) => {
                    const sets = setsByExerciseId.get(exercise.id) ?? [];
                    const completed = sets.filter(
                      (s) => s.reps_completed !== null
                    ).length;
                    const name = exercise.exercise_id
                      ? nameById.get(exercise.exercise_id) ?? "Exercise"
                      : exercise.custom_name ?? "Exercise";

                    return (
                      <li key={exercise.id} className="text-sm">
                        <p className="text-foreground">{name}</p>
                        <p className="text-muted">
                          Prescribed: {exercise.prescribed_sets} x{" "}
                          {exercise.prescribed_reps}
                          {exercise.prescribed_weight
                            ? ` @ ${exercise.prescribed_weight}`
                            : ""}{" "}
                          · Completed: {completed}/{sets.length} sets
                          {sets.length > 0 && (
                            <>
                              {" "}
                              (
                              {sets
                                .map((s) =>
                                  s.reps_completed !== null
                                    ? `${s.reps_completed}${
                                        s.weight_used
                                          ? ` @ ${s.weight_used}`
                                          : ""
                                      }`
                                    : "skipped"
                                )
                                .join(", ")}
                              )
                            </>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                {log.notes && (
                  <p className="mt-3 text-sm text-muted">
                    &quot;{log.notes}&quot;
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
