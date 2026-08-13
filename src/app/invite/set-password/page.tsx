import { requireProfile } from "@/lib/supabase/dal";
import { AuthCard } from "@/components/auth-card";
import { SetPasswordForm } from "@/components/set-password-form";

export default async function SetPasswordPage() {
  // Sends signed-out visitors to /login immediately, instead of only
  // failing once they submit the form.
  await requireProfile("client");

  return (
    <AuthCard
      title="Set your password"
      subtitle="Your trainer has invited you - choose a password to activate your account."
    >
      <SetPasswordForm />
    </AuthCard>
  );
}
