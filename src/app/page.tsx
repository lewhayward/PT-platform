import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DecorativeMedallion } from "@/components/decorative-medallion";

// Signed-in visitors never see this - proxy.ts redirects them straight to
// their dashboard. This is just the gateway for signed-out visitors.
export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-4 text-center animate-fade-in">
      <DecorativeMedallion className="-top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2" />
      <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Trainr
      </p>
      <h1 className="mt-4 max-w-md text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        Everything for your clients, in one refined place.
      </h1>
      <p className="mt-4 max-w-sm text-muted">
        Workouts, nutrition and progress tracking - built for personal
        trainers and their clients.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/signup">
          <Button className="w-full sm:w-auto">Get started</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary" className="w-full sm:w-auto">
            Log in
          </Button>
        </Link>
      </div>
    </div>
  );
}
