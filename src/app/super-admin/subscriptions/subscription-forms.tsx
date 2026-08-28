"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateTenantPlanAction,
  ensurePlanConfigsAction,
  type SubState,
} from "@/application/use-cases/super-admin/subscription";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SubscriptionForms({
  plans,
  tenants,
}: {
  plans: {
    code: string;
    name: string;
    priceMonthly: number;
    maxStudents: number;
    maxStaff: number;
  }[];
  tenants: {
    id: string;
    name: string;
    plan: string;
    status: string;
    slug: string;
    maxStudents: number;
    maxStaff: number;
  }[];
}) {
  const [planState, planAction, planPending] = useActionState(
    updateTenantPlanAction,
    {} as SubState
  );
  const [seedState, seedAction, seedPending] = useActionState(
    async (_prev: SubState, _formData: FormData) => ensurePlanConfigsAction(),
    {} as SubState
  );


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">টেনান্ট প্ল্যান পরিবর্তন</CardTitle>
          <CardDescription>প্ল্যান বদলালে max students/staff আপডেট হয়</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={planAction} className="space-y-3">
            <select name="tenantId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                টেনান্ট *
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.plan})
                </option>
              ))}
            </select>
            <select name="plan" required className={inputClass} defaultValue="BASIC">
              {(plans.length
                ? plans
                : [
                    { code: "BASIC", name: "Basic" },
                    { code: "STANDARD", name: "Standard" },
                    { code: "PREMIUM", name: "Premium" },
                    { code: "ENTERPRISE", name: "Enterprise" },
                  ]
              ).map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
            <select name="status" className={inputClass} defaultValue="ACTIVE">
              <option value="TRIAL">Trial</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {planState.error && <p className="text-xs text-red-600">{planState.error}</p>}
            {planState.success && (
              <p className="text-xs text-emerald-600">প্ল্যান আপডেট হয়েছে</p>
            )}
            <Button type="submit" className="w-full" disabled={planPending || tenants.length === 0}>
              {planPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "আপডেট"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">প্ল্যান সিড</CardTitle>
          <CardDescription>
            BASIC / STANDARD / PREMIUM / ENTERPRISE ক্যাটালগ তৈরি
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={seedAction}>
            <Button type="submit" variant="outline" disabled={seedPending}>
              {seedPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সিড প্ল্যান ক্যাটালগ"}
            </Button>
          </form>
          {seedState.success && (
            <p className="text-xs text-emerald-600">প্ল্যান সিড সম্পন্ন</p>
          )}
          {seedState.error && <p className="text-xs text-red-600">{seedState.error}</p>}

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">টেনান্ট প্ল্যান বিতরণ</p>
            {tenants.map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span>{t.name}</span>
                <span className="text-muted-foreground">
                  {t.plan} · {t.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
