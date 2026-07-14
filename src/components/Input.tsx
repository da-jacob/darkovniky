import { cn } from "@/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-accent focus:ring-2 focus:ring-accent/20",
          error && "border-red-300 focus:border-red-400 focus:ring-red-100",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
