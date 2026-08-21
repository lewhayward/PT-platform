"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import {
  NutritionTargetsSchema,
  type NutritionTargetsFormState,
} from "@/lib/definitions";

// Loads the trainer_clients row for this URL's :id. RLS alone isn't a tight
// enough check here - trainer_clients has a SEPARATE select policy letting
// the client themselves see their own row too, so an explicit trainer_id
// filter is needed to actually assert "this is one of MY clients" rather
// than just "this row is visible to me".
async function getOwnedClient(trainerClientId: string) {
  const trainer = await requireProfile("trainer");
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("trainer_clients")
    .select("id, client_id")
    .eq("id", trainerClientId)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!client) {
    throw new Error("Client not found");
  }

  return { trainer, supabase, client };
}

export async function setNutritionTargets(
  trainerClientId: string,
  _state: NutritionTargetsFormState,
  formData: FormData
): Promise<NutritionTargetsFormState> {
  const { trainer, supabase, client } = await getOwnedClient(trainerClientId);

  const validated = NutritionTargetsSchema.safeParse({
    dailyCalories: formData.get("dailyCalories"),
    dailyProteinG: formData.get("dailyProteinG"),
    dailyCarbsG: formData.get("dailyCarbsG"),
    dailyFatG: formData.get("dailyFatG"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { dailyCalories, dailyProteinG, dailyCarbsG, dailyFatG } =
    validated.data;

  const { error } = await supabase.from("nutrition_targets").upsert(
    {
      trainer_id: trainer.id,
      client_id: client.client_id,
      daily_calories: dailyCalories,
      daily_protein_g: dailyProteinG,
      daily_carbs_g: dailyCarbsG,
      daily_fat_g: dailyFatG,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trainer_id,client_id" }
  );

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/trainer/clients/${trainerClientId}`);
  redirect(`/trainer/clients/${trainerClientId}`);
}
