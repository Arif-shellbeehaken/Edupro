"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <form action={action} className="max-w-lg space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Logo URL</label>
        <input
          name="logoUrl"
          defaultValue={defaults.logoUrl}
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
              defaultValue={defaults.primaryColor || "#059669"}
              className="h-10 w-14 cursor-pointer rounded border"
            />
            <input
              defaultValue={defaults.primaryColor || "#059669"}
              readOnly
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
              defaultValue={defaults.secondaryColor || "#0f766e"}
              className="h-10 w-14 cursor-pointer rounded border"
            />
            <input
              defaultValue={defaults.secondaryColor || "#0f766e"}
              readOnly
              className={inputClass}
            />
          </div>
        </div>
      </div>
      <div
        className="rounded-lg border p-3 text-sm"
        style={{
          borderColor: defaults.primaryColor || "#059669",
          background: `${defaults.primaryColor || "#059669"}12`,
        }}
      >
        <p className="font-medium" style={{ color: defaults.primaryColor || "#059669" }}>
          প্রিভিউ — white-label অ্যাকসেন্ট
        </p>
        <p className="text-xs text-muted-foreground">
          Sidebar / বাটন থিমে primaryColor ব্যবহার করা যাবে (CSS variable হুক পরবর্তী)
        </p>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">{state.message}</p>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="notify" />
        স্টাফ/প্রতিষ্ঠানকে থিম publish SMS
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ব্র্যান্ডিং সেভ"}
      </Button>
    </form>
  );
}
