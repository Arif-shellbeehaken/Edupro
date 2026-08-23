"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  createHifzEntryAction,
  type CreateHifzEntryState,
} from "@/application/use-cases/hifz/create-entry";

const initial: CreateHifzEntryState = {};

export default function HifzEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? "";
  const [state, formAction, pending] = useActionState(createHifzEntryAction, initial);

  useEffect(() => {
    if (state.success) {
      router.push(studentId ? `/tenant/admin/hifz/${studentId}` : "/tenant/admin/hifz");
      router.refresh();
    }
  }, [state, router, studentId]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-xl">
        <Link
          href="/tenant/admin/hifz"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          হিফজ তালিকায় ফিরে যান
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>নতুন হিফজ এন্ট্রি</CardTitle>
            <CardDescription>
              সবক / সবকি / মঞ্জিল রেকর্ড করুন
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="studentId">
                  শিক্ষার্থী ID (ডাটাবেজ)
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  required
                  defaultValue={studentId}
                  placeholder="Student cuid"
                  className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="stream">
                  স্ট্রিম
                </label>
                <select
                  id="stream"
                  name="stream"
                  required
                  defaultValue="SABAK"
                  className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="SABAK">সবক (নতুন হিফজ)</option>
                  <option value="SABKI">সবকি (সাম্প্রতিক রিভিশন)</option>
                  <option value="MANZIL">মঞ্জিল (পুরনো রিভিশন)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fromJuz">
                    শুরু জুজ
                  </label>
                  <input
                    id="fromJuz"
                    name="fromJuz"
                    type="number"
                    min={1}
                    max={30}
                    required
                    defaultValue={1}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fromPage">
                    শুরু পৃষ্ঠা
                  </label>
                  <input
                    id="fromPage"
                    name="fromPage"
                    type="number"
                    min={1}
                    max={604}
                    required
                    defaultValue={1}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="toJuz">
                    শেষ জুজ
                  </label>
                  <input
                    id="toJuz"
                    name="toJuz"
                    type="number"
                    min={1}
                    max={30}
                    required
                    defaultValue={1}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="toPage">
                    শেষ পৃষ্ঠা
                  </label>
                  <input
                    id="toPage"
                    name="toPage"
                    type="number"
                    min={1}
                    max={604}
                    required
                    defaultValue={2}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="quality">
                  তিলাওয়াতের মান
                </label>
                <select
                  id="quality"
                  name="quality"
                  required
                  defaultValue="GOOD"
                  className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="EXCELLENT">চমৎকার (৫)</option>
                  <option value="GOOD">ভালো (৪)</option>
                  <option value="AVERAGE">মোটামুটি (৩)</option>
                  <option value="NEEDS_WORK">উন্নতি প্রয়োজন (২)</option>
                  <option value="WEAK">দুর্বল (১)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="mistakesCount">
                  ভুলের সংখ্যা (ঐচ্ছিক)
                </label>
                <input
                  id="mistakesCount"
                  name="mistakesCount"
                  type="number"
                  min={0}
                  className="flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="teacherNote">
                  শিক্ষকের নোট
                </label>
                <textarea
                  id="teacherNote"
                  name="teacherNote"
                  rows={3}
                  className="flex w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              {state.error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {state.error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  "এন্ট্রি সংরক্ষণ করুন"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
