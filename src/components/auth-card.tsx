import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

// Shared centred-card frame used by both the login and sign-up pages, so
// they look and feel identical.
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        <Card>{children}</Card>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        )}
      </div>
    </div>
  );
}
