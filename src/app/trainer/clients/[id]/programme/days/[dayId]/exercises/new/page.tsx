import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ExerciseForm } from "@/components/exercise-form";
import { addExercise } from "@/app/trainer/clients/[id]/programme/actions";

export default async function NewExercisePage(
  props: PageProps<"/trainer/clients/[id]/programme/days/[dayId]/exercises/new">
) {
  await requireProfile("trainer");
  const { id: trainerClientId, dayId } = await props.params;
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment")
    .order("muscle_group")
    .order("name");

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">Add an exercise</h2>
      <Card className="mt-6">
        <ExerciseForm
          action={addExercise.bind(null, dayId, trainerClientId)}
          exercises={exercises ?? []}
          submitLabel="Add exercise"
        />
      </Card>
    </div>
  );
}
