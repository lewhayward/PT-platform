import { Card } from "@/components/ui/card";

// Empty dashboard shell for Phase 1. Assigned workouts arrive in Phase 3.
export default function ClientDashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
      <Card className="mt-6 text-center">
        <p className="text-muted">
          Nothing here yet - your trainer hasn&apos;t assigned anything.
        </p>
      </Card>
    </div>
  );
}
