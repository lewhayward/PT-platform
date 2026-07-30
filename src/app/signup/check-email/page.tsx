import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export default function CheckEmailPage() {
  return (
    <AuthCard
      title="Check your inbox"
      subtitle="We've sent you a link to confirm your email address."
      footer={
        <>
          Already confirmed?{" "}
          <Link href="/login" className="font-medium text-accent">
            Log in
          </Link>
        </>
      }
    >
      <p className="text-sm text-muted">
        Click the link in the email to activate your account. You can close
        this tab.
      </p>
    </AuthCard>
  );
}
