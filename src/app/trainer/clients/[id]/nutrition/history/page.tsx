import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

const DAYS_SHOWN = 14;

export default async function NutritionHistoryPage(
  props: PageProps<"/trainer/clients/[id]/nutrition/history">
) {
  const trainer = await requireProfile("trainer");
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, client_id, email")
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

  const clientName = profile?.full_name ?? client.email;

  const { data: targets, error: targetsError } = await supabase
    .from("nutrition_targets")
    .select("daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g")
    .eq("client_id", client.client_id)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (targetsError) {
    throw new Error(targetsError.message);
  }

  // Bounded by calendar date, not by row count - a row-count limit here
  // would silently truncate a heavily-logged recent day's totals rather
  // than dropping only genuinely older days.
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (DAYS_SHOWN - 1));
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data: logs, error: logsError } = await supabase
    .from("food_logs")
    .select("logged_date, name, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", client.client_id)
    .gte("logged_date", cutoffIso)
    .order("logged_date", { ascending: false });

  if (logsError) {
    throw new Error(logsError.message);
  }

  const totalsByDate = new Map<
    string,
    { calories: number; protein_g: number; carbs_g: number; fat_g: number; entries: number }
  >();
  for (const log of logs ?? []) {
    const existing =
      totalsByDate.get(log.logged_date) ??
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, entries: 0 };
    existing.calories += log.calories;
    existing.protein_g += Number(log.protein_g);
    existing.carbs_g += Number(log.carbs_g);
    existing.fat_g += Number(log.fat_g);
    existing.entries += 1;
    totalsByDate.set(log.logged_date, existing);
  }

  const days = [...totalsByDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, DAYS_SHOWN);

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {clientName}&apos;s nutrition history
        </h2>
        <Link
          href={`/trainer/clients/${client.id}`}
          className="text-sm text-accent"
        >
          Back to profile
        </Link>
      </div>

      {days.length === 0 ? (
        <Card className="mt-6 text-center">
          <p className="text-muted">No food logged yet.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {days.map(([date, totals]) => (
            <Card key={date}>
              <div className="flex items-baseline justify-between">
                <p className="font-medium text-foreground">
                  {new Date(date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p className="text-sm text-muted">
                  {totals.entries} item{totals.entries === 1 ? "" : "s"}
                </p>
              </div>
              <p className="mt-2 text-sm text-foreground">
                {totals.calories} kcal
                {targets ? ` / ${targets.daily_calories}` : ""}
              </p>
              <p className="text-sm text-muted">
                Protein: {Math.round(totals.protein_g)}
                {targets ? `/${targets.daily_protein_g}` : ""}g · Carbs:{" "}
                {Math.round(totals.carbs_g)}
                {targets ? `/${targets.daily_carbs_g}` : ""}g · Fat:{" "}
                {Math.round(totals.fat_g)}
                {targets ? `/${targets.daily_fat_g}` : ""}g
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
