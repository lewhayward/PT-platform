"use client";

import { useActionState } from "react";
import { setProgressTarget } from "@/app/trainer/clients/[id]/progress/actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

export function ProgressTargetForm({
  trainerClientId,
  defaultTargetWeightKg,
}: {
  trainerClientId: string;
  defaultTargetWeightKg?: number;
}) {
  const [state, action] = useActionState(
    setProgressTarget.bind(null, trainerClientId),
    undefined
  );

  return (
    <form action={action} className="flex items-end gap-3">
      <div className="flex-1">
        <Field
          label="Target weight (kg)"
          htmlFor="targetWeightKg"
          error={state?.errors?.targetWeightKg?.[0]}
        >
          <Input
            id="targetWeightKg"
            name="targetWeightKg"
            type="number"
            min={20}
            max={400}
            step="0.1"
            defaultValue={defaultTargetWeightKg}
          />
        </Field>
      </div>
      <SubmitButton pendingLabel="Saving…">Save target</SubmitButton>
      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
    </form>
  );
}
