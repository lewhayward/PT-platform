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
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
        status === "active"
          ? "bg-accent/10 text-accent"
          : "bg-border text-muted"
      )}
    >
      {labels[status]}
    </span>
  );
}
