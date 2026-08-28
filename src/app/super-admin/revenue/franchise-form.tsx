"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  setFranchiseShareAction,
  type FranchiseState,
} from "@/application/use-cases/super-admin/franchise";
import { Button } from "@/components/ui/button";

const inputClass =
  "flex h-10 w-full rounded-lg border px-3 text-sm";

export function FranchiseForm() {
  const [state, action, pending] = useActionState(
    setFranchiseShareAction,
    {} as FranchiseState
  );
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-4 items-end">
      <input name="slug" required placeholder="tenant slug" className={inputClass} />
      <input name="partnerName" placeholder="Partner name" className={inputClass} />
      <input name="sharePercent" type="number" min={0} max={100} defaultValue={20} className={inputClass} />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Franchise share"}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-4">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600 sm:col-span-4">{state.message}</p>}
    </form>
  );
}
