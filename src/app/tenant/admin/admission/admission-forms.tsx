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
  createLeadAction,
  updateLeadStatusAction,
  sendAdmissionOfferAction,
  type ActionState,
} from "@/application/use-cases/crm/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const STATUSES = [
  { v: "NEW", n: "নতুন" },
  { v: "CONTACTED", n: "যোগাযোগ" },
  { v: "VISIT_SCHEDULED", n: "ভিজিট" },
  { v: "DOCUMENTS", n: "ডকুমেন্ট" },
  { v: "OFFERED", n: "অফার" },
  { v: "ADMITTED", n: "ভর্তি" },
  { v: "REJECTED", n: "বাতিল" },
  { v: "LOST", n: "হারিয়েছে" },
];

export function AdmissionForms({
  leads,
}: {
  leads: {
    id: string;
    name: string;
    phone: string;
    status: string;
    applyingClass: string | null;
    source: string | null;
  }[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createLeadAction,
    {} as ActionState
  );
  const [statusState, statusAction, statusPending] = useActionState(
    updateLeadStatusAction,
    {} as ActionState
  );

  
  const [offerState, offerAction, offerPending] = useActionState(
    sendAdmissionOfferAction,
    {} as ActionState
  );
const active = leads.filter(
    (l) => !["ADMITTED", "REJECTED", "LOST"].includes(l.status)
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন লিড</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAction} className="space-y-2">
            <input name="applicantName" required placeholder="আবেদনকারীর নাম *" className={inputClass} />
            <input name="applicantNameBn" placeholder="বাংলা নাম" className={inputClass} />
            <input name="fatherName" placeholder="পিতার নাম" className={inputClass} />
            <input name="phone" required placeholder="ফোন *" className={inputClass} />
            <input name="applyingClass" placeholder="ক্লাস (হিফজ / দাখিল...)" className={inputClass} />
            <select name="source" className={inputClass} defaultValue="WALK_IN">
              <option value="WALK_IN">Walk-in</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="SOCIAL">Social</option>
              <option value="OTHER">Other</option>
            </select>
            <input name="notes" placeholder="নোট" className={inputClass} />
            {createState.error && <p className="text-xs text-red-600">{createState.error}</p>}
            {createState.success && <p className="text-xs text-emerald-600">লিড তৈরি হয়েছে</p>}
            <Button type="submit" className="w-full" disabled={createPending}>
              {createPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "লিড যোগ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">পাইপলাইন আপডেট · SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">সক্রিয় লিড নেই</p>
          ) : (
            active.slice(0, 8).map((l) => (
              <form
                key={l.id}
                action={statusAction}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
              >
                <div className="min-w-[120px] flex-1 text-sm">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.phone}</p>
                </div>
                <input type="hidden" name="leadId" value={l.id} />
                <select name="status" className="h-9 rounded-lg border px-2 text-sm" defaultValue={l.status}>
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.n}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={statusPending}>
                  সেভ
                </Button>
              </form>
            ))
          )}
          {statusState.success && (
            <p className="text-xs text-emerald-600">
              {statusState.message || "স্ট্যাটাস আপডেট হয়েছে"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">ভর্তি অফার লেটার · SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={offerAction} className="grid gap-2 sm:grid-cols-2">
            <select name="leadId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                লিড *
              </option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone}) — {l.status}
                </option>
              ))}
            </select>
            <input name="feeNote" placeholder="ফি নোট (যেমন ৳৫০০০)" className={inputClass} />
            <input name="joinDate" type="date" className={inputClass} />
            <Button type="submit" disabled={offerPending || leads.length === 0}>
              {offerPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "অফার লেটার SMS"}
            </Button>
            {offerState.error && (
              <p className="text-xs text-red-600 sm:col-span-2">{offerState.error}</p>
            )}
            {offerState.success && (
              <p className="text-xs text-emerald-600 sm:col-span-2">{offerState.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
