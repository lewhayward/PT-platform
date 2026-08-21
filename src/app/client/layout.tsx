import { requireProfile } from "@/lib/supabase/dal";
import { DashboardHeader } from "@/components/dashboard-header";
import { PageTransition } from "@/components/page-transition";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login if signed out, or to /trainer if signed in as a trainer.
  const profile = await requireProfile("client");

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader fullName={profile.full_name} roleLabel="Client" />
      <main className="flex-1 px-4 py-8 sm:px-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
