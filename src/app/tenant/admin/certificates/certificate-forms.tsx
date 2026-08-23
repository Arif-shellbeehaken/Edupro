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
  issueCertificateAction,
  type CertState,
} from "@/application/use-cases/certificates/issue";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function CertificateForms({
  students,
}: {
  students: { id: string; name: string; studentId: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    issueCertificateAction,
    {} as CertState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">নতুন সার্টিফিকেট ইস্যু</CardTitle>
        <CardDescription>
          শিক্ষার্থী সিলেক্ট করলে নাম/পিতা অটো ভরাট হবে
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <select name="certType" required className={inputClass} defaultValue="CHARACTER">
            <option value="TRANSFER">ট্রান্সফার সার্টিফিকেট</option>
            <option value="CHARACTER">চারিত্রিক সনদ</option>
            <option value="TESTIMONIAL">টেস্টিমোনিয়াল</option>
            <option value="HIFZ_COMPLETION">হিফজ সমাপনী</option>
            <option value="BIRTH">জন্ম সনদ</option>
            <option value="OTHER">অন্যান্য</option>
          </select>
          <select name="studentId" className={inputClass} defaultValue="">
            <option value="">শিক্ষার্থী (ঐচ্ছিক)</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.studentId})
              </option>
            ))}
          </select>
          <input name="studentName" placeholder="নাম (ম্যানুয়াল)" className={inputClass} />
          <input name="fatherName" placeholder="পিতার নাম" className={inputClass} />
          <input name="className" placeholder="ক্লাস" className={inputClass} />
          <input name="remarks" placeholder="মন্তব্য" className={inputClass} />
          <div className="sm:col-span-2">
            {state.error && <p className="mb-2 text-xs text-red-600">{state.error}</p>}
            {state.success && (
              <p className="mb-2 text-xs text-emerald-600">
                ইস্যু হয়েছে: {state.certificateNo}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ইস্যু করুন"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
