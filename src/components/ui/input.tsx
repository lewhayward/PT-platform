import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-surface-raised px-4 text-sm text-foreground placeholder:text-muted/70 transition-colors duration-200 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
