"use client";

import { useActionState } from "react";
import { setNutritionTargets } from "@/app/trainer/clients/[id]/nutrition/actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

export function NutritionTargetsForm({
  trainerClientId,
  defaults,
}: {
  trainerClientId: string;
  defaults: {
    dailyCalories?: number;
    dailyProteinG?: number;
    dailyCarbsG?: number;
    dailyFatG?: number;
  };
}) {
  const [state, action] = useActionState(
    setNutritionTargets.bind(null, trainerClientId),
    undefined
  );

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <Field
        label="Daily calories"
        htmlFor="dailyCalories"
        error={state?.errors?.dailyCalories?.[0]}
      >
        <Input
          id="dailyCalories"
          name="dailyCalories"
          type="number"
          min={500}
          max={10000}
          defaultValue={defaults.dailyCalories}
          placeholder="e.g. 2200"
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field
          label="Protein (g)"
          htmlFor="dailyProteinG"
          error={state?.errors?.dailyProteinG?.[0]}
        >
          <Input
            id="dailyProteinG"
            name="dailyProteinG"
            type="number"
            min={0}
            max={999}
            defaultValue={defaults.dailyProteinG}
          />
        </Field>
        <Field
          label="Carbs (g)"
          htmlFor="dailyCarbsG"
          error={state?.errors?.dailyCarbsG?.[0]}
        >
          <Input
            id="dailyCarbsG"
            name="dailyCarbsG"
            type="number"
            min={0}
            max={999}
            defaultValue={defaults.dailyCarbsG}
          />
        </Field>
        <Field
          label="Fat (g)"
          htmlFor="dailyFatG"
          error={state?.errors?.dailyFatG?.[0]}
        >
          <Input
            id="dailyFatG"
            name="dailyFatG"
            type="number"
            min={0}
            max={999}
            defaultValue={defaults.dailyFatG}
          />
        </Field>
      </div>

      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}

      <SubmitButton pendingLabel="Saving…" className="w-full sm:w-auto">
        Save targets
      </SubmitButton>
    </form>
  );
}
