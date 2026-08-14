import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercise-form";
import { updateExercise } from "@/app/trainer/clients/[id]/programme/actions";

export default async function EditExercisePage(
  props: PageProps<"/trainer/clients/[id]/programme/days/[dayId]/exercises/[exerciseId]/edit">
) {
  await requireProfile("trainer");
  const { id: trainerClientId, exerciseId } = await props.params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("programme_exercises")
    .select("id, exercise_id, custom_name, sets, reps, weight, notes")
    .eq("id", exerciseId)
    .single();

  if (!exercise) {
    notFound();
  }

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment")
    .order("muscle_group")
    .order("name");

  let exerciseName = exercise.custom_name ?? "";
  if (exercise.exercise_id) {
    const match = exercises?.find((e) => e.id === exercise.exercise_id);
    exerciseName = match?.name ?? exerciseName;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">Edit exercise</h2>
      <Card className="mt-6">
        <ExerciseForm
          action={updateExercise.bind(null, exerciseId, trainerClientId)}
          exercises={exercises ?? []}
          defaultValues={{
            exerciseName,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight ?? undefined,
            notes: exercise.notes ?? undefined,
          }}
          submitLabel="Save changes"
        />
      </Card>
    </div>
  );
}
