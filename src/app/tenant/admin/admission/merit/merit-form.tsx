"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateMeritListAction,
  type MeritState,
} from "@/application/use-cases/crm/merit";

export function MeritForm() {
  const [state, action, pending] = useActionState(
    generateMeritListAction,
    {} as MeritState
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input
        name="applyingClass"
        placeholder="ক্লাস ফিল্টার (ঐচ্ছিক)"
        className="h-10 rounded-lg border px-3 text-sm"
      />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "মেধাতালিকা জেনারেট"}
      </Button>
      {state.message && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
