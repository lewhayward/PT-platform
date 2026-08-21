import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] sm:p-8",
        className
      )}
      {...props}
    />
  );
}
