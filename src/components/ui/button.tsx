import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-[0_2px_12px_-2px_rgba(201,162,77,0.35)] hover:bg-accent-hover hover:shadow-[0_6px_20px_-4px_rgba(201,162,77,0.5)] hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
  secondary:
    "bg-surface-raised text-foreground border border-border hover:border-accent/40 hover:text-accent disabled:opacity-50",
  ghost:
    "text-muted hover:bg-surface-raised hover:text-foreground disabled:opacity-50",
  danger:
    "bg-danger text-danger-foreground hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0",
};

// Shared button styling so every action in the app looks and feels the
// same - a gentle lift + glow on hover, a slight press on click, so
// pressing a button feels tactile rather than flat.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-all duration-200 cursor-pointer active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
