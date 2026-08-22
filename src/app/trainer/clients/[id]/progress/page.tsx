import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ProgressTargetForm } from "@/components/progress-target-form";
import { WeightTrendChart } from "@/components/weight-trend-chart";

export default async function TrainerProgressPage(
  props: PageProps<"/trainer/clients/[id]/progress">
) {
  const trainer = await requireProfile("trainer");
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, client_id, email")
    .eq("id", id)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (!client) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", client.client_id)
    .single();

  const clientName = profile?.full_name ?? client.email;

  const { data: target, error: targetError } = await supabase
    .from("progress_targets")
    .select("target_weight_kg")
    .eq("client_id", client.client_id)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  const { data: weightLogs, error: weightError } = await supabase
    .from("weight_logs")
    .select("logged_date, weight_kg")
    .eq("client_id", client.client_id)
    .order("logged_date", { ascending: true })
    .limit(180);

  if (weightError) {
    throw new Error(weightError.message);
  }

  const chartPoints = (weightLogs ?? []).map((w) => ({
    date: w.logged_date,
    weightKg: Number(w.weight_kg),
  }));

  const { data: photoRows, error: photosError } = await supabase
    .from("progress_photos")
    .select("id, logged_date, storage_path")
    .eq("client_id", client.client_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (photosError) {
    throw new Error(photosError.message);
  }

  const paths = (photoRows ?? []).map((p) => p.storage_path);
  const { data: signedUrls, error: signError } =
    paths.length > 0
      ? await supabase.storage.from("progress-photos").createSignedUrls(paths, 3600)
      : { data: [], error: null };

  if (signError) {
    throw new Error(signError.message);
  }

  const urlByPath = new Map(
    (signedUrls ?? [])
      .filter((u) => !u.error && u.signedUrl)
      .map((u) => [u.path, u.signedUrl])
  );

  return (
    <div className="mx-auto max-w-lg">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {clientName}&apos;s progress
        </h2>
        <Link
          href={`/trainer/clients/${client.id}`}
          className="text-sm text-accent"
        >
          Back to profile
        </Link>
      </div>

      <Card className="mt-6">
        <ProgressTargetForm
          trainerClientId={client.id}
          defaultTargetWeightKg={target?.target_weight_kg}
        />
      </Card>

      <Card className="mt-4">
        <h3 className="text-sm font-medium text-muted">Weight trend</h3>
        <div className="mt-3">
          <WeightTrendChart
            points={chartPoints}
            targetKg={target?.target_weight_kg ?? null}
          />
        </div>
      </Card>

      {photoRows && photoRows.length > 0 && (
        <Card className="mt-4">
          <h3 className="text-sm font-medium text-muted">Progress photos</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoRows.map((photo) => {
              const url = urlByPath.get(photo.storage_path);
              return (
                <div key={photo.id} className="flex flex-col gap-1">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Progress photo from ${photo.logged_date}`}
                      className="aspect-square w-full rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-surface-raised text-xs text-muted">
                      Unavailable
                    </div>
                  )}
                  <p className="text-xs text-muted">
                    {new Date(photo.logged_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
