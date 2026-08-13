"use client";

import { useActionState } from "react";
import { setPassword } from "@/app/invite/actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export function SetPasswordForm() {
  const [state, action] = useActionState(setPassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        label="Password"
        htmlFor="password"
        error={state?.errors?.password?.[0]}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        error={state?.errors?.confirmPassword?.[0]}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
        />
      </Field>

      {state?.message && <p className="text-sm text-danger">{state.message}</p>}

      <SubmitButton pendingLabel="Saving…" className="mt-1 w-full">
        Activate my account
      </SubmitButton>
    </form>
  );
}
