"use client";

import { useActionState } from "react";
import { saveDayAsTemplate } from "@/app/trainer/clients/[id]/programme/actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function SaveTemplateForm({
  dayId,
  trainerClientId,
}: {
  dayId: string;
  trainerClientId: string;
}) {
  const [state, action] = useActionState(
    saveDayAsTemplate.bind(null, dayId, trainerClientId),
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Template name" htmlFor="name" error={state?.errors?.name?.[0]}>
        <Input id="name" name="name" placeholder="e.g. Push Day A" />
      </Field>
      {state?.message && <p className="text-sm text-danger">{state.message}</p>}
      <SubmitButton pendingLabel="Saving…" className="w-full">
        Save template
      </SubmitButton>
    </form>
  );
}
