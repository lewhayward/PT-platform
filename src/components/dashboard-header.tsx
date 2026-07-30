import { logout } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

// Top bar shared by the trainer and client dashboards: a greeting on the
// left, a log-out button on the right. Nav links for specific sections
// (clients, workouts, nutrition, ...) get added here in later phases.
export function DashboardHeader({
  fullName,
  roleLabel,
}: {
  fullName: string | null;
  roleLabel: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-8">
      <div>
        <p className="text-sm text-muted">{roleLabel}</p>
        <p className="font-medium text-foreground">
          {fullName ?? "Welcome"}
        </p>
      </div>
      <form action={logout}>
        <SubmitButton pendingLabel="Logging out…" variant="ghost">
          Log out
        </SubmitButton>
      </form>
    </header>
  );
}
