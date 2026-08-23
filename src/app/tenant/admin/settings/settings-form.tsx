"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateTenantSettingsAction,
  type SettingsState,
} from "@/application/use-cases/settings/update-tenant";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function SettingsForm({
  defaults,
}: {
  defaults: {
    name: string;
    nameBn: string;
    email: string;
    phone: string;
    address: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateTenantSettingsAction,
    {} as SettingsState
  );

  return (
    <form action={formAction} className="max-w-lg space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">নাম (ইংরেজি) *</label>
        <input name="name" required defaultValue={defaults.name} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">বাংলা নাম</label>
        <input name="nameBn" defaultValue={defaults.nameBn} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">ইমেইল</label>
        <input name="email" type="email" defaultValue={defaults.email} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">ফোন</label>
        <input name="phone" defaultValue={defaults.phone} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">ঠিকানা</label>
        <input name="address" defaultValue={defaults.address} className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-xs text-emerald-600">সেটিংস সংরক্ষিত হয়েছে</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সংরক্ষণ"}
      </Button>
    </form>
  );
}
