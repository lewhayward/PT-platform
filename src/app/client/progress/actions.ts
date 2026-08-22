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

  // Storage's own file_size_limit/allowed_mime_types (see schema.sql) are
  // what actually stop a crafted request bypassing the checks above - this
  // is a separate guard against unbounded COUNT, which nothing else here
  // limits.
  const { count, error: countError } = await supabase
    .from("progress_photos")
    .select("id", { count: "exact", head: true })
    .eq("client_id", profile.id);

  if (countError) {
    return { message: countError.message };
  }
  if ((count ?? 0) >= 200) {
    return {
      message: "You've reached the 200-photo limit - remove some older ones first.",
    };
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  // Stored as "<client_id>/<filename>" - the storage RLS policies key off
  // that first path segment to decide who can read/write it (see
  // schema.sql), so this exact shape is load-bearing, not cosmetic.
  const requestedPath = `${profile.id}/${Date.now()}-${safeFileName(file.name)}`;

  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(requestedPath, file, { contentType: file.type });

  if (uploadError) {
    return { message: uploadError.message };
  }

  // Storage can normalise the key it actually writes (e.g. stripping a
  // stray leading/trailing slash) - recording ITS path rather than the one
  // we asked for means the two can never silently drift apart and break
  // the later signed-URL lookup.
  const path = uploaded.path;

  const { error: insertError } = await supabase.from("progress_photos").insert({
    client_id: profile.id,
    logged_date: todayIso,
    storage_path: path,
  });

  if (insertError) {
    // The upload already happened, so without this the object would sit
    // in storage with no record pointing at it (invisible in the UI,
    // wasting space forever). Best-effort and logged only - the original
    // insertError is still what gets shown to the user. Storage's
    // remove() returns 200 with an EMPTY array (not an error) when
    // nothing was actually deleted, so success is checked on the
    // returned list, not just the absence of `error`.
    const { data: removed, error: cleanupError } = await supabase.storage
      .from("progress-photos")
      .remove([path]);
    if (cleanupError || !removed?.length) {
      console.error(
        "Failed to clean up orphaned photo upload:",
        cleanupError?.message ?? "remove() reported nothing deleted"
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

  // Database row removed BEFORE the storage object - the reverse order
  // fails worse: a storage delete that succeeds followed by a database
  // delete that fails would leave a row permanently pointing at a photo
  // that's already gone (a visible, un-fixable "Unavailable" tile). This
  // order's failure mode is an orphaned file sitting in storage - invisible
  // and easy to reclaim later, same reasoning as the upload cleanup above.
  const { error: dbError } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", photoId)
    .eq("client_id", profile.id);

  if (dbError) {
    throw new Error(dbError.message);
  }

  const { data: removed, error: storageError } = await supabase.storage
    .from("progress-photos")
    .remove([photo.storage_path]);

  if (storageError || !removed?.length) {
    console.error(
      "Failed to remove progress photo file:",
      storageError?.message ?? "remove() reported nothing deleted"
    );
  }

  revalidatePath("/client/progress");
}
