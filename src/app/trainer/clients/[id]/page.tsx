import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

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
    .select("id, client_id, email, goals, notes, status, created_at")
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
