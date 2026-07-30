// A segmented "Trainer / Client" picker built from two radio inputs styled
// as pills. Pure HTML + CSS (Tailwind's peer-checked variant) so it works
// even before any JavaScript has loaded, and needs no client component.
export function RoleToggle({ defaultValue = "client" }: { defaultValue?: "trainer" | "client" }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <RoleOption
        value="trainer"
        label="I'm a trainer"
        defaultChecked={defaultValue === "trainer"}
      />
      <RoleOption
        value="client"
        label="I'm a client"
        defaultChecked={defaultValue === "client"}
      />
    </div>
  );
}

function RoleOption({
  value,
  label,
  defaultChecked,
}: {
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="role"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex h-11 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
        {label}
      </span>
    </label>
  );
}
