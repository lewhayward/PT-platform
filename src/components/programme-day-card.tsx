import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RenameDayForm } from "@/components/rename-day-form";
import {
  applyTemplateToDay,
  deleteExercise,
  markDayAsRest,
} from "@/app/trainer/clients/[id]/programme/actions";
import { DAY_LABELS, type DayOfWeek, type ProgrammeExercise } from "@/lib/types";

export function ProgrammeDayCard({
  trainerClientId,
  dayId,
  dayOfWeek,
  name,
  isRest,
  exercises,
  myTemplates,
}: {
  trainerClientId: string;
  dayId: string;
  dayOfWeek: DayOfWeek;
  name: string | null;
  isRest: boolean;
  exercises: ProgrammeExercise[];
  myTemplates: { id: string; name: string }[];
}) {
  const basePath = `/trainer/clients/${trainerClientId}/programme/days/${dayId}`;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{DAY_LABELS[dayOfWeek]}</p>
          {isRest ? (
            <p className="font-medium text-foreground">Rest day</p>
          ) : (
            <RenameDayForm
              dayId={dayId}
              trainerClientId={trainerClientId}
              currentName={name ?? ""}
            />
          )}
        </div>
        {!isRest && (
          <form action={markDayAsRest.bind(null, dayId, trainerClientId)}>
            <Button type="submit" variant="ghost" className="h-8 px-3 text-xs">
              Mark as rest day
            </Button>
          </form>
        )}
      </div>

      {!isRest && exercises.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-foreground">
                  {exercise.exercise?.name ?? exercise.custom_name}
                </p>
                <p className="text-sm text-muted">
                  {exercise.sets} sets x {exercise.reps}
                  {exercise.weight ? ` @ ${exercise.weight}` : ""}
                </p>
                {exercise.notes && (
                  <p className="mt-1 text-sm text-muted">{exercise.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`${basePath}/exercises/${exercise.id}/edit`}
                  className="text-sm font-medium text-accent"
                >
                  Edit
                </Link>
                <form action={deleteExercise.bind(null, exercise.id, trainerClientId)}>
                  <button type="submit" className="text-sm font-medium text-danger">
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
        <Link href={`${basePath}/exercises/new`} className="text-accent">
          + Add exercise
        </Link>
        {!isRest && exercises.length > 0 && (
          <>
            <Link href={`${basePath}/copy`} className="text-accent">
              Copy to other days…
            </Link>
            <Link href={`${basePath}/save-template`} className="text-accent">
              Save as template
            </Link>
          </>
        )}
      </div>

      {myTemplates.length > 0 && (
        <form
          action={applyTemplateToDay.bind(null, dayId, trainerClientId)}
          className="mt-4 flex items-center gap-2 border-t border-border pt-4"
        >
          <Select name="templateId" defaultValue="" className="h-9 text-xs">
            <option value="" disabled>
              Use one of my templates…
            </option>
            {myTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" className="h-9 shrink-0 px-3 text-xs">
            Apply
          </Button>
        </form>
      )}
    </Card>
  );
}
