"use client";

import { usePathname } from "next/navigation";

// Keying on pathname forces this wrapper (and everything inside it) to
// remount on every navigation, which re-triggers the CSS "page-enter"
// animation - a plain className wouldn't, since the element itself
// wouldn't otherwise be recreated.
//
// Deliberately placed INSIDE a section's <main>, never wrapping a
// persistent header - a header that re-animates on every click stops
// feeling like a fixed anchor and starts feeling like the whole page
// reloaded, which is the opposite of subtle.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
}
