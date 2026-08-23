"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createInventoryItemAction,
  stockTxnAction,
  type ActionState,
} from "@/application/use-cases/crm/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function InventoryForms({
  items,
}: {
  items: { id: string; name: string; quantity: number; unit: string }[];
}) {
  const [addState, addAction, addPending] = useActionState(
    createInventoryItemAction,
    {} as ActionState
  );
  const [txnState, txnAction, txnPending] = useActionState(stockTxnAction, {} as ActionState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন আইটেম</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="space-y-2">
            <input name="name" required placeholder="নাম *" className={inputClass} />
            <input name="sku" placeholder="SKU" className={inputClass} />
            <select name="category" className={inputClass} defaultValue="STATIONERY">
              <option value="STATIONERY">স্টেশনারি</option>
              <option value="UNIFORM">ইউনিফর্ম</option>
              <option value="LAB">ল্যাব</option>
              <option value="FURNITURE">ফার্নিচার</option>
              <option value="OTHER">অন্যান্য</option>
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input name="quantity" type="number" min={0} defaultValue={0} placeholder="পরিমাণ" className={inputClass} />
              <input name="minStock" type="number" min={0} defaultValue={5} placeholder="মিন স্টক" className={inputClass} />
              <input name="unitCost" type="number" min={0} defaultValue={0} placeholder="মূল্য" className={inputClass} />
            </div>
            <input name="location" placeholder="লোকেশন" className={inputClass} />
            {addState.error && <p className="text-xs text-red-600">{addState.error}</p>}
            {addState.success && <p className="text-xs text-emerald-600">আইটেম যোগ হয়েছে</p>}
            <Button type="submit" className="w-full" disabled={addPending}>
              {addPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "যোগ করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">স্টক ইন / আউট</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={txnAction} className="space-y-2">
            <select name="itemId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                আইটেম *
              </option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.quantity} {i.unit})
                </option>
              ))}
            </select>
            <select name="type" className={inputClass} defaultValue="IN">
              <option value="IN">ইন (যোগ)</option>
              <option value="OUT">আউট (খরচ)</option>
              <option value="ADJUST">অ্যাডজাস্ট (সেট)</option>
            </select>
            <input name="quantity" type="number" min={0} required defaultValue={1} className={inputClass} />
            <input name="note" placeholder="নোট" className={inputClass} />
            {txnState.error && <p className="text-xs text-red-600">{txnState.error}</p>}
            {txnState.success && (
              <p className="text-xs text-emerald-600">{txnState.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={txnPending || items.length === 0}>
              {txnPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "আপডেট"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
