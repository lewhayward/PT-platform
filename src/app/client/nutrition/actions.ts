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
    calories: formData.get("calories"),
    proteinG: formData.get("proteinG"),
    carbsG: formData.get("carbsG"),
    fatG: formData.get("fatG"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, calories, proteinG, carbsG, fatG } = validated.data;
  const todayIso = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("food_logs").insert({
    client_id: profile.id,
    logged_date: todayIso,
    name,
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
// whatever the browser sends back) - Row Level Security already limits
// this to the signed-in client's own past entries, so a made-up id just
// finds nothing.
export async function reAddFood(sourceLogId: string) {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("food_logs")
    .select("name, calories, protein_g, carbs_g, fat_g")
    .eq("id", sourceLogId)
    .single();

  if (!source) {
    throw new Error("That food could not be found.");
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("food_logs").insert({
    client_id: profile.id,
    logged_date: todayIso,
    name: source.name,
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
  await requireProfile("client");
  const supabase = await createClient();

  // No extra ownership check needed beyond this - the food_logs RLS policy
  // already restricts deletes to the signed-in client's own rows, so a
  // stray or tampered-with id from another client simply deletes nothing.
  const { error } = await supabase.from("food_logs").delete().eq("id", logId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/client/nutrition");
  revalidatePath("/client");
}
