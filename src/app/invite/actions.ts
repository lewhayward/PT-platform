"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import {
  SetPasswordSchema,
  type SetPasswordFormState,
} from "@/lib/definitions";

export async function setPassword(
  _state: SetPasswordFormState,
  formData: FormData
): Promise<SetPasswordFormState> {
  // Also confirms someone is actually signed in (the invite link should
  // have already done that via /auth/confirm) before letting them proceed.
  const profile = await requireProfile("client");

  const validated = SetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  await supabase
    .from("trainer_clients")
    .update({ status: "active" })
    .eq("client_id", profile.id);

  redirect("/client");
}
