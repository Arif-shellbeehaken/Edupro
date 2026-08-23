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
  createStaffAction,
  type CreateStaffState,
} from "@/application/use-cases/hr/staff";

const initial: CreateStaffState = {};
const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export default function NewStaffPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createStaffAction, initial);

  useEffect(() => {
    if (state.success) {
      router.push("/tenant/admin/hr");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/tenant/admin/hr"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          HR ড্যাশবোর্ডে ফিরে যান
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>নতুন স্টাফ</CardTitle>
            <CardDescription>প্রোফাইল, পদবি ও স্যালারি স্ট্রাকচার</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-emerald-700">মূল তথ্য</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">কর্মচারী আইডি *</label>
                    <input name="employeeId" required className={inputClass} placeholder="EMP-001" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">লিঙ্গ</label>
                    <select name="gender" className={inputClass} defaultValue="MALE">
                      <option value="MALE">পুরুষ</option>
                      <option value="FEMALE">নারী</option>
                      <option value="OTHER">অন্যান্য</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium">নাম *</label>
                    <input name="name" required className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">বাংলা নাম</label>
                    <input name="nameBn" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">ফোন</label>
                    <input name="phone" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">ইমেইল</label>
                    <input name="email" type="email" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">যোগদানের তারিখ</label>
                    <input name="joiningDate" type="date" className={inputClass} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-emerald-700">পদবি ও বিভাগ</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">পদবি *</label>
                    <input name="designation" required className={inputClass} placeholder="সিনিয়র শিক্ষক" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">বিভাগ</label>
                    <input name="department" className={inputClass} placeholder="হিফজ / একাডেমিক" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">রোল টাইপ</label>
                    <select name="roleType" className={inputClass} defaultValue="TEACHER">
                      <option value="TEACHER">শিক্ষক</option>
                      <option value="HIFZ_TEACHER">হিফজ শিক্ষক</option>
                      <option value="ACCOUNTANT">অ্যাকাউন্ট্যান্ট</option>
                      <option value="ADMIN">অ্যাডমিন</option>
                      <option value="SUPPORT">সাপোর্ট</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">চাকরির ধরন</label>
                    <select name="employmentType" className={inputClass} defaultValue="FULL_TIME">
                      <option value="FULL_TIME">পূর্ণকালীন</option>
                      <option value="PART_TIME">খণ্ডকালীন</option>
                      <option value="CONTRACT">চুক্তিভিত্তিক</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-emerald-700">স্যালারি স্ট্রাকচার (৳)</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">বেসিক</label>
                    <input name="basicSalary" type="number" min={0} defaultValue={0} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">বাড়ি ভাড়া</label>
                    <input name="houseRent" type="number" min={0} defaultValue={0} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">চিকিৎসা ভাতা</label>
                    <input name="medicalAllow" type="number" min={0} defaultValue={0} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">অন্যান্য ভাতা</label>
                    <input name="otherAllow" type="number" min={0} defaultValue={0} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">ব্যাংক</label>
                    <input name="bankName" className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">অ্যাকাউন্ট নং</label>
                    <input name="bankAccount" className={inputClass} />
                  </div>
                </div>
              </fieldset>

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
                  "স্টাফ যোগ করুন"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
