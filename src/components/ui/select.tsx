import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-border bg-surface-raised px-4 text-sm text-foreground transition-colors duration-200 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
