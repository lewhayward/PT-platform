import { cn } from "@/lib/cn";
import type { TrainerClientStatus } from "@/lib/types";

const labels: Record<TrainerClientStatus, string> = {
  invited: "Invited",
  active: "Active",
};

// A quick-glance pill: muted for "still just invited", accent-coloured
// once the client has actually activated their account.
export function StatusBadge({ status }: { status: TrainerClientStatus }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide",
        status === "active"
          ? "border-accent/30 bg-accent/10 text-accent"
          : "border-border bg-surface-raised text-muted"
      )}
    >
      {labels[status]}
    </span>
  );
}
