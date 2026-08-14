import { requireProfile } from "@/lib/supabase/dal";
import { Card } from "@/components/ui/card";
import { SaveTemplateForm } from "@/components/save-template-form";

export default async function SaveTemplatePage(
  props: PageProps<"/trainer/clients/[id]/programme/days/[dayId]/save-template">
) {
  await requireProfile("trainer");
  const { id: trainerClientId, dayId } = await props.params;

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="text-xl font-semibold text-foreground">
        Save as a reusable template
      </h2>
      <p className="mt-1 text-sm text-muted">
        You&apos;ll be able to drop this into any client&apos;s programme
        later.
      </p>
      <Card className="mt-6">
        <SaveTemplateForm dayId={dayId} trainerClientId={trainerClientId} />
      </Card>
    </div>
  );
}
