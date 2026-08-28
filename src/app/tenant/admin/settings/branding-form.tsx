"use client";

import { useActionState, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  updateBrandingAction,
  type TicketState,
} from "@/application/use-cases/support/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function BrandingForm({
  defaults,
}: {
  defaults: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
}) {
  const [state, action, pending] = useActionState(
    updateBrandingAction,
    {} as TicketState
  );
  const { toast } = useToast();
  useEffect(() => {
    if (state.success) {
      toast({
        title: "ব্র্যান্ডিং সেভ হয়েছে",
        description: state.message || "থিম আপডেট হয়েছে",
        kind: "success",
      });
    }
    if (state.error) {
      toast({ title: "ত্রুটি", description: state.error, kind: "error" });
    }
  }, [state, toast]);

  const [primary, setPrimary] = useState(defaults.primaryColor || "#059669");
  const [secondary, setSecondary] = useState(
    defaults.secondaryColor || "#0f766e"
  );
  const [logo, setLogo] = useState(defaults.logoUrl || "");

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium">Logo URL</label>
        <input
          name="logoUrl"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">প্রাইমারি রঙ</label>
          <div className="flex gap-2">
            <input
              type="color"
              name="primaryColor"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border"
            />
            <input
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">সেকেন্ডারি রঙ</label>
          <div className="flex gap-2">
            <input
              type="color"
              name="secondaryColor"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border"
            />
            <input
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <div
          className="flex items-center gap-3 px-4 py-3 text-white"
          style={{ backgroundColor: primary }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Logo preview"
              className="h-9 w-9 rounded-md object-cover bg-white/20"
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold"
              style={{ backgroundColor: secondary }}
            >
              EP
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">Edupro · লাইভ প্রিভিউ</p>
            <p className="text-[10px] opacity-90">Sidebar / Header theme</p>
          </div>
        </div>
        <div className="grid grid-cols-[140px_1fr] min-h-[120px]">
          <div
            className="space-y-2 border-r p-3 text-xs"
            style={{ backgroundColor: `${primary}0d` }}
          >
            <p className="font-semibold" style={{ color: primary }}>
              মেনু
            </p>
            {["ড্যাশবোর্ড", "শিক্ষার্থী", "ফি"].map((label) => (
              <div
                key={label}
                className="rounded-md px-2 py-1.5"
                style={{
                  backgroundColor: label === "ড্যাশবোর্ড" ? `${primary}22` : undefined,
                  color: label === "ড্যাশবোর্ড" ? primary : undefined,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="p-3 space-y-2">
            <div
              className="rounded-lg border px-3 py-2 text-sm font-medium"
              style={{ borderColor: primary, color: primary }}
            >
              প্রাইমারি বাটন / লিংক
            </div>
            <div
              className="rounded-lg px-3 py-2 text-sm text-white"
              style={{ backgroundColor: secondary }}
            >
              সেকেন্ডারি অ্যাকশন
            </div>
            <p className="text-[11px] text-muted-foreground">
              সেভ করলে সাইডবার ও হেডারে প্রয়োগ হবে
            </p>
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-600">
          {state.message || "ব্র্যান্ডিং আপডেট হয়েছে"}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ব্র্যান্ডিং সেভ"}
      </Button>
    </form>
  );
}
