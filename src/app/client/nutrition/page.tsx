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
  const percent =
    target !== null ? Math.min(100, Math.round((value / target) * 100)) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted">
          {value}
          {target !== null ? ` / ${target}` : ""} {unit}
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

function foodSummary(food: {
  quantity_g: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}) {
  const parts = [];
  if (food.quantity_g) parts.push(`${food.quantity_g}g`);
  parts.push(`${food.calories} kcal`);
  parts.push(`P${food.protein_g} C${food.carbs_g} F${food.fat_g}`);
  return parts.join(" · ");
}

export default async function ClientNutritionPage() {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: foodOptions, error: foodsError } = await supabase
    .from("foods")
    .select("name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
    .order("name");

  if (foodsError) {
    throw new Error(foodsError.message);
  }

  const foods = (foodOptions ?? []).map((food) => ({
    name: food.name,
    caloriesPer100g: Number(food.calories_per_100g),
    proteinPer100g: Number(food.protein_per_100g),
    carbsPer100g: Number(food.carbs_per_100g),
    fatPer100g: Number(food.fat_per_100g),
  }));

  // A client could in principle have more than one trainer (nutrition_targets
  // is uniquely keyed by trainer+client, not client alone), so this can't
  // assume at most one row - ordering by most-recently-updated and taking
  // the first one, rather than .single(), keeps that case from erroring out
  // and silently rendering "no targets set" instead.
  const { data: targetRows, error: targetsError } = await supabase
    .from("nutrition_targets")
    .select("daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g")
    .eq("client_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (targetsError) {
    throw new Error(targetsError.message);
  }
  const targets = targetRows?.[0] ?? null;

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: todaysLogs, error: todaysLogsError } = await supabase
    .from("food_logs")
    .select("id, name, quantity_g, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", profile.id)
    .eq("logged_date", todayIso)
    .order("created_at");

  if (todaysLogsError) {
    throw new Error(todaysLogsError.message);
  }

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
  const { data: recentLogs, error: recentLogsError } = await supabase
    .from("food_logs")
    .select("id, name, quantity_g, calories, protein_g, carbs_g, fat_g")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (recentLogsError) {
    throw new Error(recentLogsError.message);
  }

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
          <LogFoodForm foods={foods} />
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
                  <p className="text-muted">{foodSummary(food)}</p>
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
                  <p className="text-muted">{foodSummary(log)}</p>
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
