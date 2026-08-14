"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  InviteClientSchema,
  type InviteClientFormState,
} from "@/lib/definitions";

async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const origin = (await headers()).get("origin");
  return origin ?? "http://localhost:3000";
}

export async function inviteClient(
  _state: InviteClientFormState,
  formData: FormData
): Promise<InviteClientFormState> {
  const trainer = await requireProfile("trainer");

  const validated = InviteClientSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    goals: formData.get("goals"),
    notes: formData.get("notes"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { fullName, email, goals, notes } = validated.data;
  const siteUrl = await getSiteUrl();

  // Creates the client's account right away and emails them a link to set
  // a password. This needs the admin client (secret key) - a trainer's own
  // account has no permission to create other users.
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role: "client" },
    redirectTo: `${siteUrl}/invite/set-password`,
  });

  if (error) {
    return {
      message:
        error.code === "email_exists"
          ? "That email already has an account."
          : error.message,
    };
  }

  const supabase = await createClient();

  // The profiles.full_name trigger reads from auth.users at the moment it's
  // inserted, which isn't reliably populated yet for admin-created invites.
  // Set it explicitly via this narrow database function instead of trusting
  // that timing (a trainer's own session isn't otherwise allowed to edit
  // someone else's profile - see set_invited_client_name in schema.sql).
  const { error: nameError } = await supabase.rpc("set_invited_client_name", {
    target_client_id: data.user.id,
    new_full_name: fullName,
  });

  if (nameError) {
    return {
      message: `Invite sent, but couldn't save their name: ${nameError.message}`,
    };
  }

  const { error: insertError } = await supabase
    .from("trainer_clients")
    .insert({
      trainer_id: trainer.id,
      client_id: data.user.id,
      email,
      goals: goals || null,
      notes: notes || null,
    });

  if (insertError) {
    return { message: insertError.message };
  }

  revalidatePath("/trainer");
  redirect("/trainer");
}
