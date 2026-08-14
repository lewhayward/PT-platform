import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgrammeDayCard } from "@/components/programme-day-card";
import { startProgrammeFromScratch, createProgrammeFromTemplate } from "./actions";
import type { ProgrammeExercise } from "@/lib/types";

export default async function ProgrammePage(
  props: PageProps<"/trainer/clients/[id]/programme">
) {
  const trainer = await requireProfile("trainer");
  const { id: trainerClientId } = await props.params;
  const supabase = await createClient();

  const { data: trainerClient } = await supabase
    .from("trainer_clients")
    .select("id, client_id, email, goal, days_per_week")
    .eq("id", trainerClientId)
    .single();

  if (!trainerClient) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", trainerClient.client_id)
    .single();

  const clientName = profile?.full_name ?? trainerClient.email;

  const { data: programme } = await supabase
    .from("programmes")
    .select("id, name")
    .eq("client_id", trainerClient.client_id)
    .maybeSingle();

  if (!programme) {
    const { data: recommended } =
      trainerClient.goal && trainerClient.days_per_week
        ? await supabase
            .from("programme_templates")
            .select("id, name, description")
            .eq("goal", trainerClient.goal)
            .eq("days_per_week", trainerClient.days_per_week)
            .maybeSingle()
        : { data: null };

    return (
      <div className="mx-auto max-w-lg">
        <h2 className="text-xl font-semibold text-foreground">
          Build a programme for {clientName}
        </h2>

        {recommended && (
          <Card className="mt-6">
            <p className="text-sm font-medium text-accent">Recommended</p>
            <p className="mt-1 font-medium text-foreground">{recommended.name}</p>
            {recommended.description && (
              <p className="mt-1 text-sm text-muted">{recommended.description}</p>
            )}
            <form
              action={createProgrammeFromTemplate.bind(null, trainerClientId)}
              className="mt-4"
            >
              <input type="hidden" name="programmeTemplateId" value={recommended.id} />
              <Button type="submit" className="w-full">
                Use this programme
              </Button>
            </form>
          </Card>
        )}

        <Card className="mt-4">
          <p className="text-sm text-muted">
            Or build their week from an empty schedule.
          </p>
          <form
            action={startProgrammeFromScratch.bind(null, trainerClientId)}
            className="mt-4"
          >
            <Button type="submit" variant="secondary" className="w-full">
              Start from scratch
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const { data: days } = await supabase
    .from("programme_days")
    .select("id, day_of_week, name, is_rest")
    .eq("programme_id", programme.id)
    .order("day_of_week");

  const dayIds = days?.map((d) => d.id) ?? [];

  const { data: exercises } =
    dayIds.length > 0
      ? await supabase
          .from("programme_exercises")
          .select(
            "id, programme_day_id, exercise_id, custom_name, sets, reps, weight, notes, order_index"
          )
          .in("programme_day_id", dayIds)
          .order("order_index")
      : { data: [] };

  const exerciseIds = [
    ...new Set((exercises ?? []).map((e) => e.exercise_id).filter(Boolean)),
  ] as string[];

  const { data: libraryExercises } =
    exerciseIds.length > 0
      ? await supabase
          .from("exercises")
          .select("id, name, muscle_group, equipment")
          .in("id", exerciseIds)
      : { data: [] };

  const libraryById = new Map(libraryExercises?.map((e) => [e.id, e]));

  // A trainer's own saved templates (see "Save as template" on any built
  // day) - offered on every day as a one-click way to reuse a workout
  // they've already put together for a DIFFERENT client.
  const { data: myTemplates } = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("trainer_id", trainer.id)
    .order("name");

  const exercisesByDay = new Map<string, ProgrammeExercise[]>();
  for (const exercise of exercises ?? []) {
    const list = exercisesByDay.get(exercise.programme_day_id) ?? [];
    list.push({
      ...exercise,
      exercise: exercise.exercise_id
        ? libraryById.get(exercise.exercise_id)
        : null,
    });
    exercisesByDay.set(exercise.programme_day_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {clientName}&apos;s programme
          </h2>
          <Link
            href={`/trainer/clients/${trainerClientId}`}
            className="text-sm text-accent"
          >
            Back to profile
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {days?.map((day) => (
          <ProgrammeDayCard
            key={day.id}
            trainerClientId={trainerClientId}
            dayId={day.id}
            dayOfWeek={day.day_of_week}
            name={day.name}
            isRest={day.is_rest}
            exercises={exercisesByDay.get(day.id) ?? []}
            myTemplates={myTemplates ?? []}
          />
        ))}
      </div>
    </div>
  );
}
