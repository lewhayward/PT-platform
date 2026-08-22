"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import {
  ProgressTargetSchema,
  type ProgressTargetFormState,
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

export async function setProgressTarget(
  trainerClientId: string,
  _state: ProgressTargetFormState,
  formData: FormData
): Promise<ProgressTargetFormState> {
  const { trainer, supabase, client } = await getOwnedClient(trainerClientId);

  const validated = ProgressTargetSchema.safeParse({
    targetWeightKg: formData.get("targetWeightKg"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("progress_targets").upsert(
    {
      trainer_id: trainer.id,
      client_id: client.client_id,
      target_weight_kg: validated.data.targetWeightKg,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "trainer_id,client_id" }
  );

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/progress`);
  redirect(`/trainer/clients/${trainerClientId}/progress`);
}
