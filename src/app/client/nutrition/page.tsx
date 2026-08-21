import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogFoodForm } from "@/components/log-food-form";
import { deleteFoodLog, reAddFood } from "@/app/client/nutrition/actions";

function NutritionProgress({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
}) {
  const percent = target ? Math.min(100, Math.round((value / target) * 100)) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted">
          {value}
          {target ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      {percent !== null && (
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function ClientNutritionPage() {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: targets } = await supabase
    .from("nutrition_targets")
    .select("daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g")
    .eq("client_id", profile.id)
    .maybeSingle();

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: todaysLogs } = await supabase
    .from("food_logs")
    .select("id, name, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", profile.id)
    .eq("logged_date", todayIso)
    .order("created_at");

  const totals = (todaysLogs ?? []).reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein_g: acc.protein_g + Number(log.protein_g),
      carbs_g: acc.carbs_g + Number(log.carbs_g),
      fat_g: acc.fat_g + Number(log.fat_g),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  // Recently logged foods, deduped by name so the same thing eaten several
  // times doesn't show up as several near-identical rows in the quick-add
  // list - most recent occurrence of each name wins.
  const { data: recentLogs } = await supabase
    .from("food_logs")
    .select("id, name, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const seenNames = new Set<string>();
  const recentFoods = [];
  for (const log of recentLogs ?? []) {
    const key = log.name.trim().toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    recentFoods.push(log);
    if (recentFoods.length >= 8) break;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">
        Today&apos;s nutrition
      </h2>

      <Card className="mt-6 flex flex-col gap-3">
        {targets ? (
          <>
            <NutritionProgress
              label="Calories"
              value={totals.calories}
              target={targets.daily_calories}
              unit="kcal"
            />
            <NutritionProgress
              label="Protein"
              value={Math.round(totals.protein_g)}
              target={targets.daily_protein_g}
              unit="g"
            />
            <NutritionProgress
              label="Carbs"
              value={Math.round(totals.carbs_g)}
              target={targets.daily_carbs_g}
              unit="g"
            />
            <NutritionProgress
              label="Fat"
              value={Math.round(totals.fat_g)}
              target={targets.daily_fat_g}
              unit="g"
            />
          </>
        ) : (
          <p className="text-sm text-muted">
            {totals.calories} kcal logged today. Your trainer hasn&apos;t set
            nutrition targets yet.
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <h3 className="text-sm font-medium text-muted">Log food</h3>
        <div className="mt-3">
          <LogFoodForm />
        </div>
      </Card>

      {recentFoods.length > 0 && (
        <Card className="mt-4">
          <h3 className="text-sm font-medium text-muted">Recently logged</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {recentFoods.map((food) => (
              <li
                key={food.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="text-foreground">{food.name}</p>
                  <p className="text-muted">
                    {food.calories} kcal · P{food.protein_g} C{food.carbs_g} F
                    {food.fat_g}
                  </p>
                </div>
                <form action={reAddFood.bind(null, food.id)}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-9 w-9 rounded-full p-0 text-base"
                    aria-label={`Log ${food.name} again`}
                  >
                    +
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {todaysLogs && todaysLogs.length > 0 && (
        <Card className="mt-4">
          <h3 className="text-sm font-medium text-muted">Logged today</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {todaysLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="text-foreground">{log.name}</p>
                  <p className="text-muted">
                    {log.calories} kcal · P{log.protein_g} C{log.carbs_g} F
                    {log.fat_g}
                  </p>
                </div>
                <form action={deleteFoodLog.bind(null, log.id)}>
                  <Button type="submit" variant="ghost" className="h-9 px-3 text-xs">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
