"use client";

import { logWorkout } from "@/app/client/log/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

interface FormSet {
  setNumber: number;
  reps: number | null;
  weight: string;
}

interface FormExercise {
  id: string;
  name: string;
  prescribedSets: number;
  prescribedReps: string;
  prescribedWeight: string | null;
  sets: FormSet[];
}

export function LogWorkoutForm({
  exercises,
  defaultNotes,
}: {
  exercises: FormExercise[];
  defaultNotes: string;
}) {
  return (
    <form action={logWorkout} className="mt-6 flex flex-col gap-4">
      {exercises.map((exercise) => (
        <Card key={exercise.id}>
          <p className="font-medium text-foreground">{exercise.name}</p>
          <p className="text-sm text-muted">
            Prescribed: {exercise.prescribedSets} sets x{" "}
            {exercise.prescribedReps}
            {exercise.prescribedWeight ? ` @ ${exercise.prescribedWeight}` : ""}
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {exercise.sets.map((set) => (
              <div
                key={set.setNumber}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-14 shrink-0 text-muted">
                  Set {set.setNumber}
                </span>
                <Input
                  type="number"
                  min={0}
                  name={`reps-${exercise.id}-${set.setNumber}`}
                  defaultValue={set.reps ?? undefined}
                  placeholder="Reps"
                  className="h-9"
                />
                <Input
                  name={`weight-${exercise.id}-${set.setNumber}`}
                  defaultValue={set.weight}
                  placeholder="Weight"
                  className="h-9"
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <Field label="Notes (optional)" htmlFor="notes">
          <Textarea
            id="notes"
            name="notes"
            defaultValue={defaultNotes}
            placeholder="How did it feel?"
          />
        </Field>
      </Card>

      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save log
      </SubmitButton>
    </form>
  );
}
