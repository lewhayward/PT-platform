import Link from "next/link";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DAY_LABELS, getTodayDayOfWeek } from "@/lib/types";

async function NutritionSummary({
  supabase,
  clientId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  clientId: string;
}) {
  // Ordered + limited to one rather than .maybeSingle() - nutrition_targets
  // is keyed by (trainer_id, client_id), not client_id alone, so a client
  // with more than one trainer could have more than one row here.
  const { data: targetRows, error: targetsError } = await supabase
    .from("nutrition_targets")
    .select("daily_calories")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (targetsError) {
    throw new Error(targetsError.message);
  }
  const targets = targetRows?.[0] ?? null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: logs, error: logsError } = await supabase
    .from("food_logs")
    .select("calories")
    .eq("client_id", clientId)
    .eq("logged_date", todayIso);

  if (logsError) {
    throw new Error(logsError.message);
  }

  const caloriesLogged = (logs ?? []).reduce((sum, l) => sum + l.calories, 0);

  return (
    <Card className="mt-6 flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-foreground">Nutrition</p>
        <p className="text-sm text-muted">
          {caloriesLogged} kcal logged today
          {targets ? ` / ${targets.daily_calories}` : ""}
        </p>
      </div>
      <Link href="/client/nutrition">
        <Button variant="secondary">Log food</Button>
      </Link>
    </Card>
  );
}

export default async function ClientDashboardPage() {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: programme } = await supabase
    .from("programmes")
    .select("id")
    .eq("client_id", profile.id)
    .limit(1)
    .maybeSingle();

  if (!programme) {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        <Card className="mt-6 text-center">
          <p className="text-muted">
            Nothing here yet - your trainer hasn&apos;t assigned anything.
          </p>
        </Card>
        <NutritionSummary supabase={supabase} clientId={profile.id} />
      </div>
    );
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
          "id, exercise_id, custom_name, sets, reps, weight, notes, order_index"
        )
        .eq("programme_day_id", day.id)
        .order("order_index")
    : { data: [] };

  const exerciseIds = [
    ...new Set((exercises ?? []).map((e) => e.exercise_id).filter(Boolean)),
  ] as string[];

  const { data: libraryExercises } =
    exerciseIds.length > 0
      ? await supabase.from("exercises").select("id, name").in("id", exerciseIds)
      : { data: [] };
  const nameById = new Map(libraryExercises?.map((e) => [e.id, e.name]));

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: log } = day
    ? await supabase
        .from("workout_logs")
        .select("id")
        .eq("programme_day_id", day.id)
        .eq("logged_date", todayIso)
        .maybeSingle()
    : { data: null };

  const hasWorkout = day && !day.is_rest && exercises && exercises.length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">
        Today - {DAY_LABELS[today]}
      </h2>

      {!hasWorkout ? (
        <Card className="mt-6 text-center">
          <p className="text-muted">
            {day && !day.is_rest
              ? "Nothing added for today yet."
              : "Rest day - enjoy it!"}
          </p>
        </Card>
      ) : (
        <>
          {day.name && <p className="mt-1 text-sm text-muted">{day.name}</p>}
          <div className="mt-6 flex flex-col gap-3">
            {exercises.map((exercise) => (
              <Card key={exercise.id}>
                <p className="font-medium text-foreground">
                  {exercise.exercise_id
                    ? nameById.get(exercise.exercise_id)
                    : exercise.custom_name}
                </p>
                <p className="text-sm text-muted">
                  {exercise.sets} sets x {exercise.reps}
                  {exercise.weight ? ` @ ${exercise.weight}` : ""}
                </p>
                {exercise.notes && (
                  <p className="mt-1 text-sm text-muted">{exercise.notes}</p>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-6">
            {log ? (
              <Card className="flex items-center justify-between gap-4">
                <p className="font-medium text-accent">
                  ✓ Logged for today
                </p>
                <Link href="/client/log">
                  <Button variant="secondary">Edit log</Button>
                </Link>
              </Card>
            ) : (
              <Link href="/client/log">
                <Button className="w-full">Log this workout</Button>
              </Link>
            )}
          </div>
        </>
      )}

      <NutritionSummary supabase={supabase} clientId={profile.id} />
    </div>
  );
}
