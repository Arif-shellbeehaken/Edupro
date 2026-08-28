import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal scroll wrapper for wide tables on mobile */
export function TableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-border",
        "-mx-0 sm:mx-0",
        className
      )}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}
