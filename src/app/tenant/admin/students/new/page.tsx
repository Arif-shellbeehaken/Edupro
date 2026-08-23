"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createStudentAction,
  type CreateStudentState,
} from "@/application/use-cases/student/create";

const initial: CreateStudentState = {};
const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export default function NewStudentPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createStudentAction, initial);

  useEffect(() => {
    if (state.success) {
      router.push("/tenant/admin/students");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-xl">
        <Link
          href="/tenant/admin/students"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          তালিকায় ফিরে যান
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>নতুন শিক্ষার্থী</CardTitle>
            <CardDescription>SIS-এ শিক্ষার্থী যোগ করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="studentId">
                    স্টুডেন্ট আইডি *
                  </label>
                  <input id="studentId" name="studentId" required className={inputClass} placeholder="2025-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="gender">
                    লিঙ্গ *
                  </label>
                  <select id="gender" name="gender" required className={inputClass} defaultValue="MALE">
                    <option value="MALE">পুরুষ</option>
                    <option value="FEMALE">নারী</option>
                    <option value="OTHER">অন্যান্য</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    নাম *
                  </label>
                  <input id="name" name="name" required className={inputClass} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium" htmlFor="nameBn">
                    বাংলা নাম
                  </label>
                  <input id="nameBn" name="nameBn" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fatherName">
                    পিতার নাম
                  </label>
                  <input id="fatherName" name="fatherName" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fatherPhone">
                    পিতার ফোন
                  </label>
                  <input id="fatherPhone" name="fatherPhone" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="motherName">
                    মাতার নাম
                  </label>
                  <input id="motherName" name="motherName" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="guardianPhone">
                    অভিভাবক ফোন
                  </label>
                  <input id="guardianPhone" name="guardianPhone" className={inputClass} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isHifzStudent" className="rounded border-zinc-300" />
                হিফজ শিক্ষার্থী
              </label>

              {state.error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    সংরক্ষণ...
                  </>
                ) : (
                  "শিক্ষার্থী যোগ করুন"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
