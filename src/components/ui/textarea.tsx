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
        "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
