"use client";

import { useActionState } from "react";
import { inviteClient } from "@/app/trainer/clients/actions";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { CLIENT_GOAL_LABELS } from "@/lib/types";

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

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Primary goal"
              htmlFor="goal"
              error={state?.errors?.goal?.[0]}
            >
              <Select id="goal" name="goal" defaultValue="">
                <option value="" disabled>
                  Choose one
                </option>
                {Object.entries(CLIENT_GOAL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Days per week"
              htmlFor="daysPerWeek"
              error={state?.errors?.daysPerWeek?.[0]}
            >
              <Select id="daysPerWeek" name="daysPerWeek" defaultValue="">
                <option value="" disabled>
                  Choose one
                </option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "day" : "days"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <p className="-mt-3 text-xs text-muted">
            Used to suggest a starting workout programme - fully editable
            afterward.
          </p>

          <Field
            label="Goal details (optional)"
            htmlFor="goals"
            error={state?.errors?.goals?.[0]}
          >
            <Textarea
              id="goals"
              name="goals"
              placeholder="e.g. Specifically wants to build a bigger squat"
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
