"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/auth/actions";
import { AuthCard } from "@/components/auth-card";
import { RoleToggle } from "@/components/role-toggle";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage() {
  const [state, action] = useActionState(signup, undefined);

  return (
    <AuthCard
      title="Create your account"
      subtitle="Set up your trainer or client account in a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent">
            Log in
          </Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-5">
        <div>
          <RoleToggle />
          {state?.errors?.role && (
            <p className="mt-1.5 text-sm text-danger">{state.errors.role[0]}</p>
          )}
        </div>

        <Field label="Full name" htmlFor="fullName" error={state?.errors?.fullName?.[0]}>
          <Input id="fullName" name="fullName" autoComplete="name" placeholder="Jamie Smith" />
        </Field>

        <Field label="Email" htmlFor="email" error={state?.errors?.email?.[0]}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        </Field>

        <Field label="Password" htmlFor="password" error={state?.errors?.password?.[0]}>
          <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" />
        </Field>

        {state?.message && <p className="text-sm text-danger">{state.message}</p>}

        <SubmitButton pendingLabel="Creating account…" className="mt-1 w-full">
          Sign up
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
