"use client";

import { useActionState } from "react";
import { logFood } from "@/app/client/nutrition/actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

export function LogFoodForm() {
  const [state, action] = useActionState(logFood, undefined);

  return (
    <form
      key={state?.savedAt ?? "initial"}
      action={action}
      className="flex flex-col gap-3"
    >
      <Field label="Food" htmlFor="name" error={state?.errors?.name?.[0]}>
        <Input id="name" name="name" placeholder="e.g. Chicken and rice" />
      </Field>

      <Field
        label="Amount (g) - optional"
        htmlFor="quantityG"
        error={state?.errors?.quantityG?.[0]}
      >
        <Input
          id="quantityG"
          name="quantityG"
          type="number"
          min={1}
          max={5000}
          placeholder="e.g. 200"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field
          label="Calories"
          htmlFor="calories"
          error={state?.errors?.calories?.[0]}
        >
          <Input id="calories" name="calories" type="number" min={0} />
        </Field>
        <Field
          label="Protein (g)"
          htmlFor="proteinG"
          error={state?.errors?.proteinG?.[0]}
        >
          <Input id="proteinG" name="proteinG" type="number" min={0} step="0.1" />
        </Field>
        <Field
          label="Carbs (g)"
          htmlFor="carbsG"
          error={state?.errors?.carbsG?.[0]}
        >
          <Input id="carbsG" name="carbsG" type="number" min={0} step="0.1" />
        </Field>
        <Field label="Fat (g)" htmlFor="fatG" error={state?.errors?.fatG?.[0]}>
          <Input id="fatG" name="fatG" type="number" min={0} step="0.1" />
        </Field>
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <SubmitButton pendingLabel="Logging…" className="w-full sm:w-auto">
        Log food
      </SubmitButton>
    </form>
  );
}
