import { cn } from "@/lib/utils";

/** The business logo from Settings, or a simple "H" badge until one is uploaded. */
export function BrandLogo({
  url,
  name = "HONOBI",
  className,
  fallbackClassName,
}: {
  url?: string | null;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={`${name} logo`} className={cn("h-9 w-auto max-w-[9rem] object-contain", className)} />
    );
  }
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold",
        fallbackClassName
      )}
    >
      H
    </div>
  );
}
