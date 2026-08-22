"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import {
  WeightLogSchema,
  type WeightLogFormState,
  type PhotoUploadFormState,
} from "@/lib/definitions";

export async function logWeight(
  _state: WeightLogFormState,
  formData: FormData
): Promise<WeightLogFormState> {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const validated = WeightLogSchema.safeParse({
    weightKg: formData.get("weightKg"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  // One entry per day - logging again today updates today's value rather
  // than creating a second point that would look like a glitch on the
  // trend chart.
  const { error } = await supabase.from("weight_logs").upsert(
    {
      client_id: profile.id,
      logged_date: todayIso,
      weight_kg: validated.data.weightKg,
    },
    { onConflict: "client_id,logged_date" }
  );

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/client/progress");
  revalidatePath("/client");
  return {};
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

export async function uploadProgressPhoto(
  _state: PhotoUploadFormState,
  formData: FormData
): Promise<PhotoUploadFormState> {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a photo to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { message: "That file doesn't look like an image." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { message: "That image is too large - use one under 8MB." };
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  // Stored as "<client_id>/<filename>" - the storage RLS policies key off
  // that first path segment to decide who can read/write it (see
  // schema.sql), so this exact shape is load-bearing, not cosmetic.
  const path = `${profile.id}/${Date.now()}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { message: uploadError.message };
  }

  const { error: insertError } = await supabase.from("progress_photos").insert({
    client_id: profile.id,
    logged_date: todayIso,
    storage_path: path,
  });

  if (insertError) {
    // The upload already happened, so without this the object would sit
    // in storage with no record pointing at it (invisible in the UI,
    // wasting space forever). Best-effort and logged only - the original
    // insertError is still what gets shown to the user.
    const { error: cleanupError } = await supabase.storage
      .from("progress-photos")
      .remove([path]);
    if (cleanupError) {
      console.error(
        "Failed to clean up orphaned photo upload:",
        cleanupError.message
      );
    }
    return { message: insertError.message };
  }

  revalidatePath("/client/progress");
  return { savedAt: Date.now() };
}

export async function deleteProgressPhoto(photoId: string) {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  const { data: photo, error: fetchError } = await supabase
    .from("progress_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("client_id", profile.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }
  if (!photo) {
    throw new Error("Photo not found.");
  }

  // Storage object removed before the database row - if this fails, we
  // bail before touching the row, so the record never points at a photo
  // that's already gone.
  const { error: storageError } = await supabase.storage
    .from("progress-photos")
    .remove([photo.storage_path]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: dbError } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", photoId)
    .eq("client_id", profile.id);

  if (dbError) {
    throw new Error(dbError.message);
  }

  revalidatePath("/client/progress");
}
