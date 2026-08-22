"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// UPC-A (12 digits) and EAN-13 (13 digits) are the same GS1 numbering
// space - a UPC-A is just an EAN-13 with a leading zero dropped - so a
// barcode detector reporting one or the other for the same physical
// product is routine. Without normalising, the two forms would cache as
// two different rows for the same product. UPC-E (compressed 8-digit) is
// deliberately left unexpanded here - it needs a proper decompression
// table, not just padding - so it's looked up/cached as-is.
function normalizeBarcode(barcode: string): string {
  return barcode.length === 12 ? `0${barcode}` : barcode;
}

// Rejects anything that isn't an actual finite number rather than coercing
// it - Number(null), Number(""), and Number(false) are all 0, which would
// otherwise let a product with missing nutrition data silently look like
// "0 calories" instead of "we don't know".
function parseNutrient(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Clamped to a real 0-100g/100g range rather than trusted outright - a
// malformed or wildly wrong macro value from a third-party API shouldn't
// be able to reach the shared library or a client's log unchallenged.
function clampMacro(value: number | null): number {
  if (value === null || value < 0) return 0;
  return Math.min(value, 100);
}

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

  const trimmed = rawBarcode.trim();
  if (!/^\d{6,14}$/.test(trimmed)) {
    return { ok: false, message: "That doesn't look like a valid barcode." };
  }
  const barcode = normalizeBarcode(trimmed);

  const { data: existing, error: existingError } = await supabase
    .from("foods")
    .select("name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g")
    .eq("barcode", barcode)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to look up cached barcode:", existingError.message);
    return { ok: false, message: "Something went wrong looking that up. Please try again." };
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
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=code,product_name,nutriments`,
      {
        headers: { "User-Agent": "Trainr-App/1.0" },
        signal: AbortSignal.timeout(5000),
      }
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

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, message: "Could not read a reply from the food database." };
  }

  if (typeof data !== "object" || data === null) {
    return { ok: false, message: "Could not read a reply from the food database." };
  }
  const parsed = data as {
    status?: number;
    code?: string;
    product?: { product_name?: unknown; nutriments?: Record<string, unknown> };
  };

  if (parsed.status !== 1 || !parsed.product) {
    return {
      ok: false,
      message: "That barcode wasn't found - try typing the food in manually instead.",
    };
  }

  const nutriments = parsed.product.nutriments ?? {};
  // Real-world plausibility bounds (0 to ~900 kcal/100g, the ceiling for
  // pure fat/oil) - a present-but-empty or non-numeric field should be
  // treated as "we don't know", not as a real value of zero.
  const caloriesPer100g = parseNutrient(nutriments["energy-kcal_100g"]);
  if (caloriesPer100g === null || caloriesPer100g <= 0 || caloriesPer100g > 900) {
    return {
      ok: false,
      message: "That product doesn't have usable nutrition information.",
    };
  }

  const proteinPer100g = clampMacro(parseNutrient(nutriments["proteins_100g"]));
  const carbsPer100g = clampMacro(parseNutrient(nutriments["carbohydrates_100g"]));
  const fatPer100g = clampMacro(parseNutrient(nutriments["fat_100g"]));
  const name = String(parsed.product.product_name || "Scanned product").slice(0, 200);
  // Prefer Open Food Facts' own canonical code over our normalised guess,
  // when it returned one - it already accounts for check digits and
  // encoding quirks better than a simple zero-pad.
  const cacheBarcode =
    typeof parsed.code === "string" && /^\d{6,14}$/.test(parsed.code)
      ? parsed.code
      : barcode;

  // Caching is a nice-to-have, not something the client is waiting on - a
  // failure here shouldn't block them from using the value they just
  // looked up, it just means the next scan of this product won't be an
  // instant local hit. Logged rather than silently dropped. Uses the
  // admin client because regular signed-in users have no write access to
  // the shared `foods` table at all (see schema.sql) - letting any client
  // write there directly would let them corrupt it for everyone else.
  // ignoreDuplicates means "do nothing on a barcode we already have" -
  // this only runs after the lookup above found nothing, so a duplicate
  // here just means someone else's scan won the race, which is fine.
  const admin = createAdminClient();
  const { error: cacheError } = await admin.from("foods").upsert(
    {
      name,
      barcode: cacheBarcode,
      calories_per_100g: caloriesPer100g,
      protein_per_100g: proteinPer100g,
      carbs_per_100g: carbsPer100g,
      fat_per_100g: fatPer100g,
    },
    { onConflict: "barcode", ignoreDuplicates: true }
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
