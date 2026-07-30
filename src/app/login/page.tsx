"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth-card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage() {
  const [state, action] = useActionState(login, undefined);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to view your workouts and progress."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-accent">
            Create an account
          </Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email" error={state?.errors?.email?.[0]}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>

        <Field label="Password" htmlFor="password" error={state?.errors?.password?.[0]}>
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Your password" />
        </Field>

        {state?.message && <p className="text-sm text-danger">{state.message}</p>}

        <SubmitButton pendingLabel="Logging in…" className="mt-1 w-full">
          Log in
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
