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
  createPurchaseOrderAction,
  completeStocktakeAction,
  type ActionState,
} from "@/application/use-cases/crm/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function InventoryForms({
  items,
}: {
  items: { id: string; name: string; quantity: number; unit: string }[];
}) {
  const [addState, addAction, addPending] = useActionState(
    createInventoryItemAction,
    {} as ActionState
  );
  const [txnState, txnAction, txnPending] = useActionState(
    stockTxnAction,
    {} as ActionState
  );
  const [poState, poAction, poPending] = useActionState(
    createPurchaseOrderAction,
    {} as ActionState
  );
  const [stkState, stkAction, stkPending] = useActionState(
    completeStocktakeAction,
    {} as ActionState
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন আইটেম</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="space-y-2">
            <input name="name" required placeholder="নাম *" className={inputClass} />
            <input name="nameBn" placeholder="বাংলা নাম" className={inputClass} />
            <input name="sku" placeholder="SKU" className={inputClass} />
            <input name="category" placeholder="ক্যাটাগরি" className={inputClass} />
            <input name="unit" placeholder="ইউনিট" defaultValue="pcs" className={inputClass} />
            <input name="quantity" type="number" min={0} defaultValue={0} className={inputClass} />
            <input name="minStock" type="number" min={0} defaultValue={5} className={inputClass} />
            {addState.error && <p className="text-xs text-red-600">{addState.error}</p>}
            {addState.success && (
              <p className="text-xs text-emerald-600">আইটেম যোগ হয়েছে</p>
            )}
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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">ক্রয় অর্ডার (PO) · SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={poAction} className="grid gap-2 sm:grid-cols-2">
            <select name="itemId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                আইটেম *
              </option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (স্টক {i.quantity})
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min={1} required defaultValue={1} className={inputClass} />
            <input name="vendorName" placeholder="ভেন্ডর নাম" className={inputClass} />
            <input name="vendorPhone" placeholder="ভেন্ডর ফোন (SMS)" className={inputClass} />
            <input name="unitCost" type="number" min={0} placeholder="একক মূল্য ৳" className={inputClass} />
            <input name="note" placeholder="নোট" className={inputClass} />
            <Button type="submit" disabled={poPending || items.length === 0} className="sm:col-span-2">
              {poPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "PO + স্টক ইন"}
            </Button>
            {poState.error && (
              <p className="text-xs text-red-600 sm:col-span-2">{poState.error}</p>
            )}
            {poState.success && (
              <p className="text-xs text-emerald-600 sm:col-span-2">{poState.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">স্টকটেক · SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={stkAction} className="space-y-2">
            <select name="itemId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                আইটেম *
              </option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (সিস্টেম {i.quantity})
                </option>
              ))}
            </select>
            <input
              name="quantity"
              type="number"
              min={0}
              required
              placeholder="ফিজিক্যাল কাউন্ট *"
              className={inputClass}
            />
            <Button type="submit" className="w-full" disabled={stkPending || items.length === 0}>
              {stkPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "স্টকটেক সম্পন্ন"}
            </Button>
            {stkState.error && <p className="text-xs text-red-600">{stkState.error}</p>}
            {stkState.success && (
              <p className="text-xs text-emerald-600">{stkState.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
