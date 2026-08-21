import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={3}
      className={cn(
        "w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 transition-colors duration-200 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
