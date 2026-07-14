import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent-hover shadow-sm shadow-accent/20",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-stone-50",
  ghost: "text-muted hover:bg-stone-100",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
