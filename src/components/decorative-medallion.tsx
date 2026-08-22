import { cn } from "@/lib/cn";

// A quiet, oversized sunburst that mostly bleeds off the edge of whatever
// frame it sits in - decoration only (aria-hidden, no layout weight via
// absolute positioning), meant to be dropped into shared chrome
// (DashboardHeader, AuthCard, the landing hero) rather than anywhere near
// real data, so it never competes with content for attention.
export function DecorativeMedallion({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        // -z-10 is load-bearing, not decorative: an absolutely-positioned
        // element with no z-index paints AFTER plain static content (per
        // CSS stacking order), which would put this on top of ordinary
        // text/buttons and obscure them. Negative z-index moves it into
        // the "paints first" bucket instead, so it always stays behind
        // sibling content regardless of whether that content happens to
        // be positioned itself.
        "pointer-events-none absolute -z-10 rounded-full bg-medallion opacity-[0.07]",
        className
      )}
    />
  );
}
