import Link from "next/link";
import { Button } from "@/components/ui/button";

// Signed-in visitors never see this - proxy.ts redirects them straight to
// their dashboard. This is just the gateway for signed-out visitors.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="max-w-md text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Everything for your clients, in one calm place.
      </h1>
      <p className="mt-4 max-w-sm text-muted">
        Workouts, nutrition and progress tracking - built for personal
        trainers and their clients.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
