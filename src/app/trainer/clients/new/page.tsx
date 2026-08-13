"use client";

import { useActionState } from "react";
import { inviteClient } from "@/app/trainer/clients/actions";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

export default function NewClientPage() {
  const [state, action] = useActionState(inviteClient, undefined);

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">Add a client</h2>
      <p className="mt-1 text-sm text-muted">
        They&apos;ll get an email with a link to set up their account.
      </p>

      <Card className="mt-6">
        <form action={action} className="flex flex-col gap-5">
          <Field
            label="Full name"
            htmlFor="fullName"
            error={state?.errors?.fullName?.[0]}
          >
            <Input id="fullName" name="fullName" placeholder="Jamie Smith" />
          </Field>

          <Field
            label="Email"
            htmlFor="email"
            error={state?.errors?.email?.[0]}
          >
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jamie@example.com"
            />
          </Field>

          <Field
            label="Goals (optional)"
            htmlFor="goals"
            error={state?.errors?.goals?.[0]}
          >
            <Textarea
              id="goals"
              name="goals"
              placeholder="e.g. Build strength, run a 5k..."
            />
          </Field>

          <Field
            label="Notes (optional)"
            htmlFor="notes"
            error={state?.errors?.notes?.[0]}
          >
            <Textarea
              id="notes"
              name="notes"
              placeholder="Anything else worth remembering"
            />
          </Field>

          {state?.message && (
            <p className="text-sm text-danger">{state.message}</p>
          )}

          <SubmitButton pendingLabel="Sending invite…" className="mt-1 w-full">
            Send invite
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
