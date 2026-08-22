"use client";

import { useActionState } from "react";
import { logWeight } from "@/app/client/progress/actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

export function WeightLogForm({
  defaultWeightKg,
}: {
  defaultWeightKg?: number;
}) {
  const [state, action] = useActionState(logWeight, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field
            label="Today's weight (kg)"
            htmlFor="weightKg"
            error={state?.errors?.weightKg?.[0]}
          >
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              min={20}
              max={400}
              step="0.1"
              defaultValue={defaultWeightKg}
            />
          </Field>
        </div>
        <SubmitButton pendingLabel="Saving…">Log weight</SubmitButton>
      </div>
      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
    </form>
  );
}
