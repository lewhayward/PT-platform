"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { FoodLogSchema, type FoodLogFormState } from "@/lib/definitions";

export async function logFood(
  _state: FoodLogFormState,
  formData: FormData
): Promise<FoodLogFormState> {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const validated = FoodLogSchema.safeParse({
    name: formData.get("name"),
    quantityG: formData.get("quantityG"),
    calories: formData.get("calories"),
    proteinG: formData.get("proteinG"),
    carbsG: formData.get("carbsG"),
    fatG: formData.get("fatG"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, quantityG, calories, proteinG, carbsG, fatG } = validated.data;
  const todayIso = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("food_logs").insert({
    client_id: profile.id,
    logged_date: todayIso,
    name,
    quantity_g: quantityG ?? null,
    calories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/client/nutrition");
  revalidatePath("/client");
  return { savedAt: Date.now() };
}

// Re-logs a food the client has eaten before, dated today. Re-reads the
// source row's own calories/macros server-side (rather than trusting
// whatever the browser sends back), explicitly scoped to the signed-in
// client's own id - food_logs' RLS select policy is actually broader than
// that (it also grants a trainer read access via trainer_clients), so this
// filter keeps the code's own intent ("my own past entries only") from
// silently drifting wider than that.
export async function reAddFood(sourceLogId: string) {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("food_logs")
    .select("name, quantity_g, calories, protein_g, carbs_g, fat_g")
    .eq("id", sourceLogId)
    .eq("client_id", profile.id)
    .maybeSingle();

  if (sourceError) {
    throw new Error(sourceError.message);
  }
  if (!source) {
    throw new Error("That food could not be found.");
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("food_logs").insert({
    client_id: profile.id,
    logged_date: todayIso,
    name: source.name,
    quantity_g: source.quantity_g,
    calories: source.calories,
    protein_g: source.protein_g,
    carbs_g: source.carbs_g,
    fat_g: source.fat_g,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/client/nutrition");
  revalidatePath("/client");
}

export type ScannedFood = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type BarcodeLookupResult =
  | { ok: true; food: ScannedFood }
  | { ok: false; message: string };

// Looks a barcode up locally first (either seeded or cached from an
// earlier scan by anyone), and only falls back to the Open Food Facts API
// - a free, open product database - if it's genuinely new to us. A
// successful API lookup is cached back into `foods` so the next person to
// scan the same product gets an instant local hit instead of another
// network round trip.
export async function lookupBarcode(
  rawBarcode: string
): Promise<BarcodeLookupResult> {
  await requireProfile("client");
  const supabase = await createClient();

  const barcode = rawBarcode.trim();
  if (!/^\d{6,14}$/.test(barcode)) {
    return { ok: false, message: "That doesn't look like a valid barcode." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("foods")
    .select("name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
    .eq("barcode", barcode)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  if (existing) {
    return {
      ok: true,
      food: {
        name: existing.name,
        caloriesPer100g: Number(existing.calories_per_100g),
        proteinPer100g: Number(existing.protein_per_100g),
        carbsPer100g: Number(existing.carbs_per_100g),
        fatPer100g: Number(existing.fat_per_100g),
      },
    };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`,
      { headers: { "User-Agent": "PT-Platform-App/1.0" } }
    );
  } catch {
    return {
      ok: false,
      message: "Could not reach the food database - check your connection and try again.",
    };
  }

  if (!response.ok) {
    return { ok: false, message: "Could not reach the food database. Try again shortly." };
  }

  const data = await response.json();
  if (data.status !== 1 || !data.product) {
    return {
      ok: false,
      message: "That barcode wasn't found - try typing the food in manually instead.",
    };
  }

  const nutriments = data.product.nutriments ?? {};
  const caloriesPer100g = Number(nutriments["energy-kcal_100g"]);
  if (!Number.isFinite(caloriesPer100g)) {
    return {
      ok: false,
      message: "That product doesn't have nutrition information available.",
    };
  }

  const proteinPer100g = Number(nutriments["proteins_100g"]) || 0;
  const carbsPer100g = Number(nutriments["carbohydrates_100g"]) || 0;
  const fatPer100g = Number(nutriments["fat_100g"]) || 0;
  const name = String(data.product.product_name || "Scanned product").slice(0, 200);

  // Caching is a nice-to-have, not something the client is waiting on - a
  // failure here shouldn't block them from using the value they just
  // looked up, it just means the next scan of this product won't be an
  // instant local hit. Logged rather than silently dropped.
  const { error: cacheError } = await supabase.from("foods").upsert(
    {
      name,
      barcode,
      calories_per_100g: caloriesPer100g,
      protein_per_100g: proteinPer100g,
      carbs_per_100g: carbsPer100g,
      fat_per_100g: fatPer100g,
    },
    { onConflict: "barcode" }
  );
  if (cacheError) {
    console.error("Failed to cache barcode lookup:", cacheError.message);
  }

  return {
    ok: true,
    food: { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g },
  };
}

export async function deleteFoodLog(logId: string) {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  // Explicit client_id filter for the same reason as reAddFood above - RLS
  // enforces it either way, but this keeps the query honest about what
  // it's actually meant to scope to.
  const { error } = await supabase
    .from("food_logs")
    .delete()
    .eq("id", logId)
    .eq("client_id", profile.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/client/nutrition");
  revalidatePath("/client");
}
