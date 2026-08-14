"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import {
  ProgrammeExerciseSchema,
  SimpleNameSchema,
  type ProgrammeExerciseFormState,
  type SimpleNameFormState,
} from "@/lib/definitions";
import { DAYS_OF_WEEK } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Loads the trainer_clients row for this URL's :id, scoped to the
// signed-in trainer by Row Level Security - a stranger's client id just
// won't match any row.
async function getOwnedClient(trainerClientId: string) {
  const trainer = await requireProfile("trainer");
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, client_id, goal, days_per_week")
    .eq("id", trainerClientId)
    .single();

  if (!client) {
    throw new Error("Client not found");
  }

  return { trainer, supabase, client };
}

// Loads this specific client's programme. RLS alone isn't enough here -
// it would happily let a trainer touch ANY of their clients' programmes,
// not just the one named in the URL, so this ties the two together
// explicitly.
async function getOwnedProgramme(trainerClientId: string) {
  const { trainer, supabase, client } = await getOwnedClient(trainerClientId);
  const { data: programme } = await supabase
    .from("programmes")
    .select("id")
    .eq("client_id", client.client_id)
    .eq("trainer_id", trainer.id)
    .single();

  if (!programme) {
    throw new Error("Programme not found");
  }

  return { trainer, supabase, programme };
}

// Confirms dayId actually belongs to THIS client's programme, not just any
// programme this trainer happens to own - otherwise a mixed-up or
// tampered-with day id for a different client would still go through.
async function getOwnedDay(trainerClientId: string, dayId: string) {
  const { trainer, supabase, programme } =
    await getOwnedProgramme(trainerClientId);
  const { data: day } = await supabase
    .from("programme_days")
    .select("id, programme_id, name")
    .eq("id", dayId)
    .eq("programme_id", programme.id)
    .single();

  if (!day) {
    throw new Error("Day not found");
  }

  return { trainer, supabase, day };
}

async function getOwnedExercise(trainerClientId: string, exerciseId: string) {
  const { trainer, supabase, programme } =
    await getOwnedProgramme(trainerClientId);
  const { data: exercise } = await supabase
    .from("programme_exercises")
    .select("id, programme_day_id")
    .eq("id", exerciseId)
    .single();

  if (!exercise) {
    throw new Error("Exercise not found");
  }

  const { data: day } = await supabase
    .from("programme_days")
    .select("id")
    .eq("id", exercise.programme_day_id)
    .eq("programme_id", programme.id)
    .single();

  if (!day) {
    throw new Error("Exercise not found");
  }

  return { trainer, supabase, exercise };
}

// Starter template names carry a "(Bodybuilding)"-style suffix so trainers
// can tell them apart while browsing the library - not meaningful to a
// client looking at their own programme, so it's dropped here.
function stripSuffix(name: string) {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

async function resolveExerciseName(supabase: Supabase, name: string) {
  const { data } = await supabase
    .from("exercises")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  return data
    ? { exercise_id: data.id as string, custom_name: null }
    : { exercise_id: null, custom_name: name };
}

export async function startProgrammeFromScratch(trainerClientId: string) {
  const { supabase, trainer, client } = await getOwnedClient(trainerClientId);

  const { data: programme, error } = await supabase
    .from("programmes")
    .insert({ trainer_id: trainer.id, client_id: client.client_id })
    .select("id")
    .single();

  if (error || !programme) {
    throw new Error(error?.message ?? "Could not create programme.");
  }

  const { error: daysError } = await supabase.from("programme_days").insert(
    DAYS_OF_WEEK.map((day) => ({
      programme_id: programme.id,
      day_of_week: day,
    }))
  );

  if (daysError) {
    throw new Error(daysError.message);
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

export async function createProgrammeFromTemplate(
  trainerClientId: string,
  formData: FormData
) {
  const programmeTemplateId = formData.get("programmeTemplateId") as string;
  const { supabase, trainer, client } = await getOwnedClient(trainerClientId);

  const { data: programme, error } = await supabase
    .from("programmes")
    .insert({ trainer_id: trainer.id, client_id: client.client_id })
    .select("id")
    .single();

  if (error || !programme) {
    throw new Error(error?.message ?? "Could not create programme.");
  }

  const { data: days, error: daysError } = await supabase
    .from("programme_days")
    .insert(
      DAYS_OF_WEEK.map((day) => ({
        programme_id: programme.id,
        day_of_week: day,
      }))
    )
    .select("id, day_of_week");

  if (daysError || !days) {
    throw new Error(daysError?.message ?? "Could not create programme days.");
  }

  const { data: templateDays } = await supabase
    .from("programme_template_days")
    .select("day_of_week, workout_template_id")
    .eq("programme_template_id", programmeTemplateId);

  const workoutTemplateIds = [
    ...new Set((templateDays ?? []).map((d) => d.workout_template_id)),
  ];

  const { data: workoutTemplates } =
    workoutTemplateIds.length > 0
      ? await supabase
          .from("workout_templates")
          .select("id, name")
          .in("id", workoutTemplateIds)
      : { data: [] };
  const templateNameById = new Map(
    workoutTemplates?.map((t) => [t.id, t.name])
  );

  for (const templateDay of templateDays ?? []) {
    const programmeDay = days.find(
      (d) => d.day_of_week === templateDay.day_of_week
    );
    if (!programmeDay) continue;

    const { data: templateExercises } = await supabase
      .from("workout_template_exercises")
      .select(
        "exercise_id, custom_name, sets, reps, weight, notes, order_index"
      )
      .eq("template_id", templateDay.workout_template_id)
      .order("order_index");

    if (!templateExercises || templateExercises.length === 0) continue;

    const { error: exercisesError } = await supabase
      .from("programme_exercises")
      .insert(
        templateExercises.map((ex) => ({
          programme_day_id: programmeDay.id,
          exercise_id: ex.exercise_id,
          custom_name: ex.custom_name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
          order_index: ex.order_index,
        }))
      );

    if (exercisesError) {
      throw new Error(exercisesError.message);
    }

    const { error: dayUpdateError } = await supabase
      .from("programme_days")
      .update({
        is_rest: false,
        name: stripSuffix(
          templateNameById.get(templateDay.workout_template_id) ?? "Workout"
        ),
      })
      .eq("id", programmeDay.id);

    if (dayUpdateError) {
      throw new Error(dayUpdateError.message);
    }
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

export async function renameDay(
  dayId: string,
  trainerClientId: string,
  _state: SimpleNameFormState,
  formData: FormData
): Promise<SimpleNameFormState> {
  const { supabase } = await getOwnedDay(trainerClientId, dayId);

  const validated = SimpleNameSchema.safeParse({
    name: formData.get("name"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("programme_days")
    .update({ name: validated.data.name })
    .eq("id", dayId);

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

export async function markDayAsRest(dayId: string, trainerClientId: string) {
  const { supabase } = await getOwnedDay(trainerClientId, dayId);

  const { error: deleteError } = await supabase
    .from("programme_exercises")
    .delete()
    .eq("programme_day_id", dayId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error } = await supabase
    .from("programme_days")
    .update({ is_rest: true, name: null })
    .eq("id", dayId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

export async function addExercise(
  dayId: string,
  trainerClientId: string,
  _state: ProgrammeExerciseFormState,
  formData: FormData
): Promise<ProgrammeExerciseFormState> {
  const { supabase } = await getOwnedDay(trainerClientId, dayId);

  const validated = ProgrammeExerciseSchema.safeParse({
    exerciseName: formData.get("exerciseName"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    notes: formData.get("notes"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { exerciseName, sets, reps, weight, notes } = validated.data;
  const { exercise_id, custom_name } = await resolveExerciseName(
    supabase,
    exerciseName
  );

  const { count } = await supabase
    .from("programme_exercises")
    .select("id", { count: "exact", head: true })
    .eq("programme_day_id", dayId);

  const { error: insertError } = await supabase
    .from("programme_exercises")
    .insert({
      programme_day_id: dayId,
      exercise_id,
      custom_name,
      sets,
      reps,
      weight: weight || null,
      notes: notes || null,
      order_index: count ?? 0,
    });

  if (insertError) {
    return { message: insertError.message };
  }

  // Adding an exercise to a day makes it a training day, whatever it was
  // marked as before.
  const { error: dayUpdateError } = await supabase
    .from("programme_days")
    .update({ is_rest: false })
    .eq("id", dayId)
    .eq("is_rest", true);

  if (dayUpdateError) {
    return { message: dayUpdateError.message };
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

export async function updateExercise(
  exerciseId: string,
  trainerClientId: string,
  _state: ProgrammeExerciseFormState,
  formData: FormData
): Promise<ProgrammeExerciseFormState> {
  const { supabase } = await getOwnedExercise(trainerClientId, exerciseId);

  const validated = ProgrammeExerciseSchema.safeParse({
    exerciseName: formData.get("exerciseName"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    notes: formData.get("notes"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { exerciseName, sets, reps, weight, notes } = validated.data;
  const { exercise_id, custom_name } = await resolveExerciseName(
    supabase,
    exerciseName
  );

  const { error } = await supabase
    .from("programme_exercises")
    .update({
      exercise_id,
      custom_name,
      sets,
      reps,
      weight: weight || null,
      notes: notes || null,
    })
    .eq("id", exerciseId);

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

export async function deleteExercise(
  exerciseId: string,
  trainerClientId: string
) {
  const { supabase } = await getOwnedExercise(trainerClientId, exerciseId);

  const { error } = await supabase
    .from("programme_exercises")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

// Copies every exercise from one day onto one or more other days - the
// direct fix for "I have to rebuild the same workout three times a week".
export async function copyDayTo(
  sourceDayId: string,
  trainerClientId: string,
  formData: FormData
) {
  const { supabase, day: sourceDay } = await getOwnedDay(
    trainerClientId,
    sourceDayId
  );

  const requestedTargetIds = formData.getAll("targetDayId") as string[];
  if (requestedTargetIds.length === 0) {
    redirect(`/trainer/clients/${trainerClientId}/programme`);
  }

  // Only ever copy onto days belonging to the SAME programme as the source
  // day - a target id for a different client is silently dropped here
  // rather than acted on.
  const { data: validTargets } = await supabase
    .from("programme_days")
    .select("id")
    .eq("programme_id", sourceDay.programme_id)
    .in("id", requestedTargetIds);

  const targetDayIds = validTargets?.map((d) => d.id) ?? [];

  const { data: sourceExercises } = await supabase
    .from("programme_exercises")
    .select("exercise_id, custom_name, sets, reps, weight, notes, order_index")
    .eq("programme_day_id", sourceDayId)
    .order("order_index");

  for (const targetDayId of targetDayIds) {
    const { error: deleteError } = await supabase
      .from("programme_exercises")
      .delete()
      .eq("programme_day_id", targetDayId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (sourceExercises && sourceExercises.length > 0) {
      const { error: insertError } = await supabase
        .from("programme_exercises")
        .insert(
          sourceExercises.map((ex) => ({
            programme_day_id: targetDayId,
            exercise_id: ex.exercise_id,
            custom_name: ex.custom_name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            notes: ex.notes,
            order_index: ex.order_index,
          }))
        );

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    const { error: dayUpdateError } = await supabase
      .from("programme_days")
      .update({ is_rest: false, name: sourceDay.name ?? "Workout" })
      .eq("id", targetDayId);

    if (dayUpdateError) {
      throw new Error(dayUpdateError.message);
    }
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

// Saves a day the trainer has already built as a reusable template, so it
// can be dropped into any OTHER client's programme later too.
export async function saveDayAsTemplate(
  dayId: string,
  trainerClientId: string,
  _state: SimpleNameFormState,
  formData: FormData
): Promise<SimpleNameFormState> {
  const { trainer, supabase } = await getOwnedDay(trainerClientId, dayId);

  const validated = SimpleNameSchema.safeParse({
    name: formData.get("name"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { data: exercises } = await supabase
    .from("programme_exercises")
    .select("exercise_id, custom_name, sets, reps, weight, notes, order_index")
    .eq("programme_day_id", dayId)
    .order("order_index");

  const { data: template, error } = await supabase
    .from("workout_templates")
    .insert({ trainer_id: trainer.id, name: validated.data.name })
    .select("id")
    .single();

  if (error || !template) {
    return { message: error?.message ?? "Could not save template." };
  }

  if (exercises && exercises.length > 0) {
    const { error: exercisesError } = await supabase
      .from("workout_template_exercises")
      .insert(
        exercises.map((ex) => ({
          template_id: template.id,
          exercise_id: ex.exercise_id,
          custom_name: ex.custom_name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
          order_index: ex.order_index,
        }))
      );

    if (exercisesError) {
      return { message: exercisesError.message };
    }
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}

// Drops a trainer's own saved template (or a starter template) onto a day,
// replacing whatever was there before.
export async function applyTemplateToDay(
  dayId: string,
  trainerClientId: string,
  formData: FormData
) {
  const { supabase } = await getOwnedDay(trainerClientId, dayId);

  const templateId = formData.get("templateId") as string;
  if (!templateId) {
    redirect(`/trainer/clients/${trainerClientId}/programme`);
  }

  // Row Level Security means this only ever resolves for a starter
  // template or one this trainer owns - anything else (or a made-up id)
  // comes back empty, and we bail before touching the day.
  const { data: template } = await supabase
    .from("workout_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  if (!template) {
    throw new Error("Template not found.");
  }

  const { data: templateExercises } = await supabase
    .from("workout_template_exercises")
    .select("exercise_id, custom_name, sets, reps, weight, notes, order_index")
    .eq("template_id", templateId)
    .order("order_index");

  const { error: deleteError } = await supabase
    .from("programme_exercises")
    .delete()
    .eq("programme_day_id", dayId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (templateExercises && templateExercises.length > 0) {
    const { error: insertError } = await supabase
      .from("programme_exercises")
      .insert(
        templateExercises.map((ex) => ({
          programme_day_id: dayId,
          exercise_id: ex.exercise_id,
          custom_name: ex.custom_name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
          order_index: ex.order_index,
        }))
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const { error: dayUpdateError } = await supabase
    .from("programme_days")
    .update({
      is_rest: false,
      name: stripSuffix(template.name),
    })
    .eq("id", dayId);

  if (dayUpdateError) {
    throw new Error(dayUpdateError.message);
  }

  revalidatePath(`/trainer/clients/${trainerClientId}/programme`);
  redirect(`/trainer/clients/${trainerClientId}/programme`);
}
