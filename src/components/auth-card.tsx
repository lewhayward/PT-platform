import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { DecorativeMedallion } from "@/components/decorative-medallion";

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
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <DecorativeMedallion className="-top-32 -left-32 h-96 w-96" />
      <DecorativeMedallion className="-bottom-40 -right-40 h-96 w-96" />
      <div className="relative w-full max-w-sm animate-fade-in">
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
