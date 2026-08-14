"use client";

import { useActionState } from "react";
import { renameDay } from "@/app/trainer/clients/[id]/programme/actions";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function RenameDayForm({
  dayId,
  trainerClientId,
  currentName,
}: {
  dayId: string;
  trainerClientId: string;
  currentName: string;
}) {
  const [state, action] = useActionState(
    renameDay.bind(null, dayId, trainerClientId),
    undefined
  );

  return (
    <form action={action} className="mt-1 flex items-center gap-2">
      <Input
        name="name"
        defaultValue={currentName}
        placeholder="Name this day, e.g. Push Day"
        className="h-9 max-w-[220px]"
      />
      <SubmitButton pendingLabel="Saving…" variant="secondary" className="h-9 px-3 text-xs">
        Save
      </SubmitButton>
      {state?.errors?.name && (
        <p className="text-xs text-danger">{state.errors.name[0]}</p>
      )}
    </form>
  );
}
