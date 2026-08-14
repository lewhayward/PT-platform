import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { copyDayTo } from "@/app/trainer/clients/[id]/programme/actions";
import { DAY_LABELS, type DayOfWeek } from "@/lib/types";

export default async function CopyDayPage(
  props: PageProps<"/trainer/clients/[id]/programme/days/[dayId]/copy">
) {
  await requireProfile("trainer");
  const { id: trainerClientId, dayId } = await props.params;
  const supabase = await createClient();

  const { data: sourceDay } = await supabase
    .from("programme_days")
    .select("id, day_of_week, name, programme_id")
    .eq("id", dayId)
    .single();

  if (!sourceDay) {
    notFound();
  }

  const { data: otherDays } = await supabase
    .from("programme_days")
    .select("id, day_of_week, name, is_rest")
    .eq("programme_id", sourceDay.programme_id)
    .neq("id", dayId)
    .order("day_of_week");

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">
        Copy &quot;{sourceDay.name ?? "this day"}&quot; to…
      </h2>
      <p className="mt-1 text-sm text-muted">
        This replaces whatever is currently on the days you select.
      </p>

      <Card className="mt-6">
        <form
          action={copyDayTo.bind(null, dayId, trainerClientId)}
          className="flex flex-col gap-4"
        >
          {otherDays?.map((day) => (
            <label key={day.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                name="targetDayId"
                value={day.id}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-foreground">
                {DAY_LABELS[day.day_of_week as DayOfWeek]}
                {!day.is_rest && day.name && (
                  <span className="text-muted"> - currently {day.name}</span>
                )}
              </span>
            </label>
          ))}
          <Button type="submit" className="mt-2 w-full">
            Copy
          </Button>
        </form>
      </Card>
    </div>
  );
}
