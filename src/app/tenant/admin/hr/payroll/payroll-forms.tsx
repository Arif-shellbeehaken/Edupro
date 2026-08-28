"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  processPayrollAction,
  markSalaryPaidAction,
  sendPayslipSmsAction,
  type PayrollState,
} from "@/application/use-cases/hr/payroll";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const MONTHS = [
  { v: 1, n: "জানুয়ারি" },
  { v: 2, n: "ফেব্রুয়ারি" },
  { v: 3, n: "মার্চ" },
  { v: 4, n: "এপ্রিল" },
  { v: 5, n: "মে" },
  { v: 6, n: "জুন" },
  { v: 7, n: "জুলাই" },
  { v: 8, n: "আগস্ট" },
  { v: 9, n: "সেপ্টেম্বর" },
  { v: 10, n: "অক্টোবর" },
  { v: 11, n: "নভেম্বর" },
  { v: 12, n: "ডিসেম্বর" },
];

type PaymentRow = {
  id: string;
  netSalary: number;
  status: string;
  staffName: string;
  employeeId: string;
  designation: string;
  grossSalary: number;
  deduction: number;
};

export function PayrollForms({
  defaultMonth,
  defaultYear,
  latestRunId,
  payments,
}: {
  defaultMonth: number;
  defaultYear: number;
  latestRunId: string | null;
  payments: PaymentRow[];
}) {
  const [processState, processAction, processPending] = useActionState(
    processPayrollAction,
    {} as PayrollState
  );
  const [payState, payAction, payPending] = useActionState(
    markSalaryPaidAction,
    {} as PayrollState
  );

  
  const [slipState, slipAction, slipPending] = useActionState(
    sendPayslipSmsAction,
    {} as PayrollState
  );
return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">পে-রোল প্রসেস</CardTitle>
          <CardDescription>
            সব সক্রিয় স্টাফের স্যালারি জেনারেট (UNPAID ছুটি কাটা হবে)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={processAction} className="space-y-3">
            <select name="month" className={inputClass} defaultValue={defaultMonth}>
              {MONTHS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.n}
                </option>
              ))}
            </select>
            <input
              name="year"
              type="number"
              required
              defaultValue={defaultYear}
              className={inputClass}
            />
            <input name="notes" placeholder="নোট (ঐচ্ছিক)" className={inputClass} />
            {processState.error && (
              <p className="text-xs text-red-600">{processState.error}</p>
            )}
            {processState.success && (
              <p className="text-xs text-emerald-600">{processState.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={processPending}>
              <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notifyStaff" defaultChecked />
              স্টাফকে পে-রোল SMS
            </label>
            {processPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "পে-রোল প্রসেস"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">সর্বশেষ স্যালারি স্লিপ</CardTitle>
            <CardDescription>গ্রস · কর্তন · নেট · স্ট্যাটাস · পেইড মার্ক করলে স্টাফ SMS</CardDescription>
          </div>
          {latestRunId && payments.some((p) => p.status === "PENDING") && (
            <form action={payAction}>
              <input type="hidden" name="markAll" value="true" />
              <input type="hidden" name="payrollRunId" value={latestRunId} />
              <Button type="submit" size="sm" disabled={payPending}>
                সব পেইড মার্ক
              </Button>
            </form>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              প্রথমে পে-রোল প্রসেস করুন
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.staffName}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({p.employeeId}) · {p.designation}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      গ্রস ৳{p.grossSalary.toLocaleString()}
                      {p.deduction > 0 ? ` − কর্তন ৳${p.deduction.toLocaleString()}` : ""}{" "}
                      = নেট ৳{p.netSalary.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                      {p.status === "PAID" ? "পেইড" : "পেন্ডিং"}
                    </Badge>
                    {p.status === "PENDING" && (
                      <form action={payAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="paymentMethod" value="BANK" />
                        <Button type="submit" size="sm" variant="outline" disabled={payPending}>
                          পেইড
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
              {payState.error && (
                <p className="text-xs text-red-600">{payState.error}</p>
              )}
              {payState.success && (
                <p className="text-xs text-emerald-600">{payState.message}</p>
              )}
              {latestRunId && (
                <form action={slipAction} className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  <input type="hidden" name="payrollRunId" value={latestRunId} />
                  <Button type="submit" size="sm" variant="secondary" disabled={slipPending}>
                    {slipPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "বিস্তারিত পেস্লিপ SMS (PAID)"
                    )}
                  </Button>
                  {slipState.error && (
                    <p className="text-xs text-red-600">{slipState.error}</p>
                  )}
                  {slipState.success && (
                    <p className="text-xs text-emerald-600">{slipState.message}</p>
                  )}
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
