import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightLogForm } from "@/components/weight-log-form";
import { PhotoUploadForm } from "@/components/photo-upload-form";
import { WeightTrendChart } from "@/components/weight-trend-chart";
import { deleteProgressPhoto } from "@/app/client/progress/actions";

export default async function ClientProgressPage() {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  // Fetched most-recent-first then reversed for display - ordering
  // ascending with a limit would return the OLDEST 180 entries instead
  // (PostgREST applies ORDER BY before LIMIT), silently freezing the chart
  // and "current weight" once a client passes ~6 months of daily weigh-ins.
  const { data: weightLogsDesc, error: weightError } = await supabase
    .from("weight_logs")
    .select("logged_date, weight_kg")
    .eq("client_id", profile.id)
    .order("logged_date", { ascending: false })
    .limit(180);

  if (weightError) {
    throw new Error(weightError.message);
  }
  const weightLogs = weightLogsDesc ? [...weightLogsDesc].reverse() : weightLogsDesc;

  // Ordered + limited to one rather than .maybeSingle() - progress_targets
  // is keyed by (trainer_id, client_id), not client_id alone, so a client
  // with more than one trainer could have more than one row.
  const { data: targetRows, error: targetError } = await supabase
    .from("progress_targets")
    .select("target_weight_kg")
    .eq("client_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (targetError) {
    throw new Error(targetError.message);
  }
  const target = targetRows?.[0] ?? null;

  const { data: photoRows, error: photosError } = await supabase
    .from("progress_photos")
    .select("id, logged_date, storage_path")
    .eq("client_id", profile.id)
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

  // A per-path failure here (a missing object, an RLS refusal) isn't
  // reflected in the top-level signError above - without logging it, a
  // broken photo would just render "Unavailable" with no trace of why.
  for (const u of signedUrls ?? []) {
    if (u.error) {
      console.error("Failed to sign progress photo URL:", u.path, u.error);
    }
  }

  const urlByPath = new Map(
    (signedUrls ?? [])
      .filter((u) => !u.error && u.signedUrl)
      .map((u) => [u.path, u.signedUrl])
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysEntry = weightLogs?.find((w) => w.logged_date === todayIso);

  const chartPoints = (weightLogs ?? []).map((w) => ({
    date: w.logged_date,
    weightKg: Number(w.weight_kg),
  }));

  const startingWeight = chartPoints[0]?.weightKg;
  const currentWeight = chartPoints[chartPoints.length - 1]?.weightKg;
  const targetWeight = target?.target_weight_kg;

  let progressPercent: number | null = null;
  if (
    startingWeight !== undefined &&
    currentWeight !== undefined &&
    targetWeight !== undefined &&
    targetWeight !== startingWeight
  ) {
    // Works whether the goal is to lose or gain: if the target is below
    // the starting weight, both the numerator and denominator go negative
    // as weight drops, and the negatives cancel out - no separate
    // "direction" needed.
    progressPercent = Math.round(
      Math.max(
        0,
        Math.min(1, (currentWeight - startingWeight) / (targetWeight - startingWeight))
      ) * 100
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">Your progress</h2>

      <Card className="mt-6">
        <WeightLogForm defaultWeightKg={todaysEntry?.weight_kg} />
      </Card>

      {targetWeight !== undefined && (
        <Card className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-foreground">
              {currentWeight ?? "-"}kg now
            </span>
            <span className="text-muted">Target: {targetWeight}kg</span>
          </div>
          {progressPercent !== null && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </Card>
      )}

      <Card className="mt-4">
        <h3 className="text-sm font-medium text-muted">Weight trend</h3>
        <div className="mt-3">
          <WeightTrendChart points={chartPoints} targetKg={targetWeight ?? null} />
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="text-sm font-medium text-muted">Progress photos</h3>
        <p className="mt-1 text-xs text-muted">
          Optional - upload as often or as rarely as you like.
        </p>
        <div className="mt-3">
          <PhotoUploadForm />
        </div>
      </Card>

      {photoRows && photoRows.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted">
                    {new Date(photo.logged_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <form action={deleteProgressPhoto.bind(null, photo.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                    >
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
