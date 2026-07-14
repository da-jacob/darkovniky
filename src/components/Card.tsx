import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5",
        className,
      )}
      {...props}
    />
  );
}
