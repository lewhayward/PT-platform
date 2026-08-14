import { Input } from "@/components/ui/input";
import type { Exercise } from "@/lib/types";

// A plain text input wired to a <datalist> of the exercise library, so
// typing shows matching suggestions (the browser handles the filtering -
// no JavaScript needed) while still accepting anything typed as a fully
// custom exercise.
export function ExerciseNameField({
  id,
  defaultValue,
  exercises,
}: {
  id: string;
  defaultValue?: string;
  exercises: Exercise[];
}) {
  const listId = `${id}-options`;

  return (
    <>
      <Input
        id={id}
        name="exerciseName"
        list={listId}
        defaultValue={defaultValue}
        placeholder="Search the library or type your own"
        autoComplete="off"
      />
      <datalist id={listId}>
        {exercises.map((exercise) => (
          <option key={exercise.id} value={exercise.name} />
        ))}
      </datalist>
    </>
  );
}
