import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/supabase/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NutritionTargetsForm } from "@/components/nutrition-targets-form";

export default async function NutritionTargetsPage(
  props: PageProps<"/trainer/clients/[id]/nutrition">
) {
  const trainer = await requireProfile("trainer");
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("trainer_clients")
    .select("id, client_id, email")
    .eq("id", id)
    .single();

  if (!client) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", client.client_id)
    .single();

  const clientName = profile?.full_name ?? client.email;

  const { data: targets, error: targetsError } = await supabase
    .from("nutrition_targets")
    .select("daily_calories, daily_protein_g, daily_carbs_g, daily_fat_g")
    .eq("client_id", client.client_id)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (targetsError) {
    throw new Error(targetsError.message);
  }

  return (
    <div className="mx-auto max-w-lg">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {clientName}&apos;s nutrition targets
        </h2>
        <Link
          href={`/trainer/clients/${client.id}`}
          className="text-sm text-accent"
        >
          Back to profile
        </Link>
      </div>

      <Card className="mt-6">
        <NutritionTargetsForm
          trainerClientId={client.id}
          defaults={{
            dailyCalories: targets?.daily_calories,
            dailyProteinG: targets?.daily_protein_g,
            dailyCarbsG: targets?.daily_carbs_g,
            dailyFatG: targets?.daily_fat_g,
          }}
        />
      </Card>
    </div>
  );
}
