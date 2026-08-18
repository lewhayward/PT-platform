"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { getTodayDayOfWeek } from "@/lib/types";

export async function logWorkout(formData: FormData) {
  const profile = await requireProfile("client");
  const supabase = await createClient();

  // Everything here is derived server-side from who's signed in and what
  // day it is - never trusted from the form - so there's no way to log a
  // workout for a day that isn't actually today's assigned session.
  const { data: programme } = await supabase
    .from("programmes")
    .select("id")
    .eq("client_id", profile.id)
    .maybeSingle();

  if (!programme) {
    throw new Error("No programme found.");
  }

  const today = getTodayDayOfWeek();
  const { data: day } = await supabase
    .from("programme_days")
    .select("id, name")
    .eq("programme_id", programme.id)
    .eq("day_of_week", today)
    .single();

  if (!day) {
    throw new Error("Today's workout not found.");
  }

  const { data: exercises } = await supabase
    .from("programme_exercises")
    .select("id, exercise_id, custom_name, sets, reps, weight, order_index")
    .eq("programme_day_id", day.id)
    .order("order_index");

  if (!exercises || exercises.length === 0) {
    throw new Error("No exercises found for today.");
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const notes = (formData.get("notes") as string)?.trim() || null;

  // One log per day-slot per calendar date - logging again today updates
  // today's entry instead of creating a duplicate.
  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .upsert(
      {
        programme_day_id: day.id,
        client_id: profile.id,
        day_name: day.name,
        logged_date: todayIso,
        notes,
      },
      { onConflict: "programme_day_id,logged_date" }
    )
    .select("id")
    .single();

  if (logError || !log) {
    throw new Error(logError?.message ?? "Could not save log.");
  }

  // Replace any previous exercises/sets for this log - editing today's log
  // is just re-submitting the form.
  const { error: deleteError } = await supabase
    .from("workout_log_exercises")
    .delete()
    .eq("workout_log_id", log.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  for (const exercise of exercises) {
    const { data: logExercise, error: exerciseError } = await supabase
      .from("workout_log_exercises")
      .insert({
        workout_log_id: log.id,
        exercise_id: exercise.exercise_id,
        custom_name: exercise.custom_name,
        prescribed_sets: exercise.sets,
        prescribed_reps: exercise.reps,
        prescribed_weight: exercise.weight,
        order_index: exercise.order_index,
      })
      .select("id")
      .single();

    if (exerciseError || !logExercise) {
      throw new Error(
        exerciseError?.message ?? "Could not save exercise log."
      );
    }

    const setRows = [];
    for (let setNumber = 1; setNumber <= exercise.sets; setNumber++) {
      const repsRaw = formData.get(`reps-${exercise.id}-${setNumber}`);
      const weightRaw = formData.get(`weight-${exercise.id}-${setNumber}`);
      const reps =
        repsRaw !== null && repsRaw !== "" ? Number(repsRaw) : null;
      const weight =
        weightRaw !== null ? String(weightRaw).trim() || null : null;
      setRows.push({
        workout_log_exercise_id: logExercise.id,
        set_number: setNumber,
        reps_completed: reps,
        weight_used: weight,
      });
    }

    const { error: setsError } = await supabase
      .from("workout_log_sets")
      .insert(setRows);

    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  redirect("/client");
}
