"use client";

import { useActionState } from "react";
import { uploadProgressPhoto } from "@/app/client/progress/actions";
import { SubmitButton } from "@/components/submit-button";

export function PhotoUploadForm() {
  const [state, action] = useActionState(uploadProgressPhoto, undefined);

  return (
    <form
      key={state?.savedAt ?? "initial"}
      action={action}
      className="flex flex-col gap-3"
    >
      <input
        type="file"
        name="photo"
        accept="image/*"
        className="text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-foreground file:transition-colors hover:file:bg-accent-hover"
      />
      {state?.message && (
        <p className="text-sm text-danger">{state.message}</p>
      )}
      <SubmitButton
        pendingLabel="Uploading…"
        variant="secondary"
        className="w-full sm:w-auto"
      >
        Upload photo
      </SubmitButton>
    </form>
  );
}
