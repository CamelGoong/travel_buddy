import { cn } from "@/lib/utils";

/** A hashtag-style choice (checkbox or radio) used for expense tags and filters. */
export function TagChip({
  type,
  name,
  value,
  defaultChecked,
  children,
}: {
  type: "checkbox" | "radio";
  name: string;
  value: string | number;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="cursor-pointer">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors",
          "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
        )}
      >
        #{children}
      </span>
    </label>
  );
}
