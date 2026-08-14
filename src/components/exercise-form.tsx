"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { ExerciseNameField } from "@/components/exercise-name-field";
import type { Exercise } from "@/lib/types";
import type { ProgrammeExerciseFormState } from "@/lib/definitions";

export function ExerciseForm({
  action,
  exercises,
  defaultValues,
  submitLabel,
}: {
  action: (
    state: ProgrammeExerciseFormState,
    formData: FormData
  ) => Promise<ProgrammeExerciseFormState>;
  exercises: Exercise[];
  defaultValues?: {
    exerciseName?: string;
    sets?: number;
    reps?: string;
    weight?: string;
    notes?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="Exercise"
        htmlFor="exerciseName"
        error={state?.errors?.exerciseName?.[0]}
      >
        <ExerciseNameField
          id="exerciseName"
          defaultValue={defaultValues?.exerciseName}
          exercises={exercises}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Sets" htmlFor="sets" error={state?.errors?.sets?.[0]}>
          <Input
            id="sets"
            name="sets"
            type="number"
            min={1}
            max={20}
            defaultValue={defaultValues?.sets}
          />
        </Field>
        <Field label="Reps" htmlFor="reps" error={state?.errors?.reps?.[0]}>
          <Input
            id="reps"
            name="reps"
            placeholder="e.g. 8-10 or AMRAP"
            defaultValue={defaultValues?.reps}
          />
        </Field>
      </div>

      <Field
        label="Weight (optional)"
        htmlFor="weight"
        error={state?.errors?.weight?.[0]}
      >
        <Input
          id="weight"
          name="weight"
          placeholder="e.g. 60kg or bodyweight"
          defaultValue={defaultValues?.weight}
        />
      </Field>

      <Field
        label="Notes (optional)"
        htmlFor="notes"
        error={state?.errors?.notes?.[0]}
      >
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes} />
      </Field>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <SubmitButton pendingLabel="Saving…" className="mt-1 w-full">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
