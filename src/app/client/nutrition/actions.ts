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
