"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  completeOnboardingAction,
  type WizardState,
} from "@/application/use-cases/onboarding/wizard";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function OnboardingWizard({
  defaults,
}: {
  defaults: { name: string; nameBn: string; primaryColor: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [livePrimary, setLivePrimary] = useState(
    defaults.primaryColor || "#059669"
  );
  const [state, action, pending] = useActionState(
    completeOnboardingAction,
    {} as WizardState
  );

  if (state.success) {
    return (
      <Card className="w-full max-w-lg shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="text-lg font-semibold">{state.message}</p>
          <Button onClick={() => router.push("/tenant/admin/dashboard")}>
            ড্যাশবোর্ডে যান
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <CardTitle>
          ধাপ {step} / ৩ —{" "}
          {step === 1
            ? "প্রতিষ্ঠান"
            : step === 2
              ? "একাডেমিক"
              : "ফি স্ট্রাকচার"}
        </CardTitle>
        <CardDescription>
          ৩ ধাপে প্রতিষ্ঠান চালু — সেশন, ক্লাস/সেকশন, ফি · পরে Settings থেকে সম্পাদনা
        </CardDescription>
        <div className="space-y-1 pt-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    s <= step ? livePrimary || "#059669" : "#e4e4e7",
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>প্রতিষ্ঠান</span>
            <span>একাডেমিক</span>
            <span>ফি</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {/* Step 1 fields always submitted (hidden when not on step) */}
          <div className={step === 1 ? "space-y-3" : "hidden"}>
            <input
              name="name"
              required
              defaultValue={defaults.name}
              placeholder="প্রতিষ্ঠানের নাম (ইংরেজি) *"
              className={inputClass}
            />
            <input
              name="nameBn"
              defaultValue={defaults.nameBn}
              placeholder="বাংলা নাম"
              className={inputClass}
            />
            <input name="phone" placeholder="ফোন" className={inputClass} />
            <input name="address" placeholder="ঠিকানা" className={inputClass} />
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium">ব্র্যান্ড রঙ</label>
              <input
                type="color"
                name="primaryColor"
                value={livePrimary}
                onChange={(e) => setLivePrimary(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border"
              />
            </div>
          </div>

          <div className={step === 2 ? "space-y-3" : "hidden"}>
            <input
              name="yearName"
              defaultValue="2025-2026"
              placeholder="একাডেমিক বছর (2026)"
              className={inputClass}
            />
            <input
              name="className"
              defaultValue="Class 6"
              placeholder="প্রথম ক্লাসের নাম"
              className={inputClass}
            />
            <input
              name="classNameBn"
              placeholder="ক্লাসের বাংলা নাম"
              className={inputClass}
            />
            <input
              name="className2"
              placeholder="দ্বিতীয় ক্লাস (ঐচ্ছিক) e.g. Class 7"
              className={inputClass}
            />
            <input
              name="className2Bn"
              placeholder="দ্বিতীয় ক্লাস বাংলা"
              className={inputClass}
            />
          </div>

          <div className={step === 3 ? "space-y-3" : "hidden"}>
            <input
              name="feeName"
              defaultValue="Monthly Tuition"
              placeholder="ফি নাম"
              className={inputClass}
            />
            <input
              name="feeAmount"
              type="number"
              min={0}
              defaultValue={500}
              placeholder="পরিমাণ (৳)"
              className={inputClass}
            />
            <input
              name="feeName2"
              placeholder="অতিরিক্ত ফি নাম (ঐচ্ছিক)"
              className={inputClass}
            />
            <input
              name="feeAmount2"
              type="number"
              placeholder="অতিরিক্ত ফি পরিমাণ"
              className={inputClass}
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1 || pending}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              আগে
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                পরের ধাপ
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "সম্পন্ন করুন"
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
