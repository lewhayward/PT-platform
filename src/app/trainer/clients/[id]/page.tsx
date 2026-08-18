import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { CLIENT_GOAL_LABELS, type ClientGoal } from "@/lib/types";

export default async function ClientProfilePage(
  props: PageProps<"/trainer/clients/[id]">
) {
  await requireProfile("trainer");
  const { id } = await props.params;
  const supabase = await createClient();

  // Row Level Security already limits this to clients belonging to the
  // signed-in trainer - a stranger's client ID just won't match any row.
  const { data: client } = await supabase
    .from("trainer_clients")
    .select(
      "id, client_id, email, goals, notes, goal, days_per_week, status, created_at"
    )
    .eq("id", id)
    .single();

  if (!client) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", client.client_id)
    .single();

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {profile?.full_name ?? client.email}
        </h2>
        <StatusBadge status={client.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{client.email}</p>
      {client.goal && client.days_per_week && (
        <p className="mt-1 text-sm text-muted">
          {CLIENT_GOAL_LABELS[client.goal as ClientGoal]} ·{" "}
          {client.days_per_week} days/week
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Link href={`/trainer/clients/${client.id}/programme`}>
          <Button className="w-full sm:w-auto">View programme</Button>
        </Link>
        <Link href={`/trainer/clients/${client.id}/history`}>
          <Button variant="secondary" className="w-full sm:w-auto">
            Workout history
          </Button>
        </Link>
      </div>

      <Card className="mt-6 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted">Goals</h3>
          <p className="mt-1 whitespace-pre-wrap text-foreground">
            {client.goals || "No goals added yet."}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted">Notes</h3>
          <p className="mt-1 whitespace-pre-wrap text-foreground">
            {client.notes || "No notes added yet."}
          </p>
        </div>
      </Card>
    </div>
  );
}
