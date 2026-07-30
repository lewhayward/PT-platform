"use client";

import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "@/components/ui/button";

// A Button that shows a "pending" label while its parent <form> is submitting.
// Needs to be a client component because useFormStatus is a React hook.
export function SubmitButton({
  pendingLabel,
  children,
  ...props
}: ButtonProps & { pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
