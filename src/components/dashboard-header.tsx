import { logout } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { DecorativeMedallion } from "@/components/decorative-medallion";

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
    <header className="sticky top-0 z-10 flex items-center justify-between overflow-hidden border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md sm:px-8">
      <DecorativeMedallion className="-right-16 -top-24 h-48 w-48" />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-accent">
          {roleLabel}
        </p>
        <p className="font-serif text-lg text-foreground">
          {fullName ?? "Welcome"}
        </p>
      </div>
      <form action={logout} className="relative">
        <SubmitButton pendingLabel="Logging out…" variant="ghost">
          Log out
        </SubmitButton>
      </form>
    </header>
  );
}
