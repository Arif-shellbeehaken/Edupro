"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  requestParentOtpAction,
  verifyParentOtpAction,
  type ParentOtpState,
} from "@/application/use-cases/portal/parent-otp";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm";

export default function ParentLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [reqState, reqAction, reqPending] = useActionState(
    requestParentOtpAction,
    {} as ParentOtpState
  );
  const [verState, verAction, verPending] = useActionState(
    verifyParentOtpAction,
    {} as ParentOtpState
  );

  useEffect(() => {
    if (reqState.success && reqState.step === "otp") setStep("otp");
  }, [reqState]);

  useEffect(() => {
    if (verState.success) router.push("/parent");
  }, [verState, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>অভিভাবক লগইন</CardTitle>
          <CardDescription>
            শিক্ষার্থীর সাথে লিংকড মোবাইলে OTP পাঠানো হবে
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" ? (
            <form action={reqAction} className="space-y-3">
              <input
                name="phone"
                required
                placeholder="মোবাইল (01XXXXXXXXX)"
                className={inputClass}
              />
              <input
                name="tenantSlug"
                placeholder="প্রতিষ্ঠান স্লাগ (ঐচ্ছিক)"
                className={inputClass}
              />
              {reqState.error && (
                <p className="text-sm text-red-600">{reqState.error}</p>
              )}
              {reqState.success && (
                <p className="text-sm text-emerald-700">{reqState.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={reqPending}>
                {reqPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "OTP পাঠান"
                )}
              </Button>
            </form>
          ) : (
            <form action={verAction} className="space-y-3">
              <input
                name="otp"
                required
                placeholder="৬-ডিজিট OTP"
                maxLength={6}
                className={inputClass}
              />
              {verState.error && (
                <p className="text-sm text-red-600">{verState.error}</p>
              )}
              {verState.success && (
                <p className="text-sm text-emerald-700">{verState.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={verPending}>
                {verPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "ভেরিফাই ও লগইন"
                )}
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground underline"
                onClick={() => setStep("phone")}
              >
                অন্য নম্বর
              </button>
            </form>
          )}
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="underline">
              স্টাফ/অ্যাডমিন লগইন
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
