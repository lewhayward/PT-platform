import Link from "next/link";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";

export default async function TrainerDashboardPage() {
  const trainer = await requireProfile("trainer");
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("trainer_clients")
    .select("id, client_id, email, status, created_at")
    .eq("trainer_id", trainer.id)
    .order("created_at", { ascending: false });

  const clientIds = clients?.map((c) => c.client_id) ?? [];
  const { data: profiles } =
    clientIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds)
      : { data: [] };

  const nameById = new Map(profiles?.map((p) => [p.id, p.full_name]));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Clients</h2>
        <Link href="/trainer/clients/new">
          <Button>Add client</Button>
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <Card className="mt-6 text-center">
          <p className="text-muted">
            Your client list will show up here once you start adding clients.
          </p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/trainer/clients/${client.id}`}>
              <Card className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-background sm:p-4">
                <div>
                  <p className="font-medium text-foreground">
                    {nameById.get(client.client_id) ?? client.email}
                  </p>
                  <p className="text-sm text-muted">{client.email}</p>
                </div>
                <StatusBadge status={client.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
