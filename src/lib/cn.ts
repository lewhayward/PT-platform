type ClassValue = string | false | null | undefined;

// Tiny helper to join conditional class names without pulling in a dependency.
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
