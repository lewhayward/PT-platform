import { Card } from "@/components/ui/card";

// Empty dashboard shell for Phase 1. Client management arrives in Phase 2.
export default function TrainerDashboardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
      <Card className="mt-6 text-center">
        <p className="text-muted">
          Your client list will show up here once you start adding clients.
        </p>
      </Card>
    </div>
  );
}
