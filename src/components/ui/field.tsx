import { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Wraps a label + input + optional error message with consistent spacing,
// so every form field in the app lines up the same way.
export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}
