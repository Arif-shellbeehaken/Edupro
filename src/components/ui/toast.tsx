"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "default" | "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
};

type ToastCtx = {
  toast: (opts: {
    title: string;
    description?: string;
    kind?: ToastKind;
  }) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const c = useContext(Ctx);
  if (!c) {
    return {
      toast: (opts: { title: string; description?: string; kind?: ToastKind }) => {
        if (typeof window !== "undefined") {
          console.info("[toast]", opts.title, opts.description ?? "");
        }
      },
    };
  }
  return c;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (opts: { title: string; description?: string; kind?: ToastKind }) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description,
        kind: opts.kind ?? "default",
      };
      setItems((prev) => [...prev.slice(-4), item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 4000);
    },
    []
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(100%-2rem,22rem)] flex-col gap-2 safe-bottom"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border bg-card px-4 py-3 shadow-lg",
              t.kind === "success" && "border-emerald-200 dark:border-emerald-900",
              t.kind === "error" && "border-red-200 dark:border-red-900"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    t.kind === "success" && "text-emerald-700 dark:text-emerald-400",
                    t.kind === "error" && "text-red-700 dark:text-red-400"
                  )}
                >
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                aria-label="Dismiss"
                onClick={() =>
                  setItems((prev) => prev.filter((x) => x.id !== t.id))
                }
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
