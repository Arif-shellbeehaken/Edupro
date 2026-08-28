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
        className
      )}
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="min-w-[640px]">{children}</div>
    </div>
  );
}

/**
 * Semantic table with sticky header for long lists.
 * Usage: <DataTable><thead>...</thead><tbody>...</tbody></DataTable>
 */
export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableScroll>
      <table className={cn("w-full border-collapse text-sm", className)}>
        {children}
      </table>
    </TableScroll>
  );
}

export function DataTableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-[1] border-b border-border bg-card/95 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </thead>
  );
}

export function DataTableTh({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {children}
    </th>
  );
}

export function DataTableTd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-t border-border/60 px-3 py-2.5 align-middle", className)}>
      {children}
    </td>
  );
}
