"use client";

import { use, useActionState } from "react";
import Link from "next/link";
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
  publicAdmissionAction,
  type PublicAdmissionState,
} from "@/application/use-cases/crm/public-admission";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

export default function PublicAdmissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [state, action, pending] = useActionState(
    publicAdmissionAction,
    {} as PublicAdmissionState
  );

  if (state.success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-lg font-semibold text-emerald-700">
              আবেদন জমা হয়েছে
            </p>
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <Button asChild variant="outline">
              <Link href={`/p/${slug}`}>হোমে ফিরুন</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>অনলাইন ভর্তি আবেদন</CardTitle>
          <CardDescription>
            প্রতিষ্ঠান: {slug} · তথ্য পূরণ করে জমা দিন
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-3">
            <input type="hidden" name="tenantSlug" value={slug} />
            <input
              name="applicantName"
              required
              placeholder="আবেদনকারীর নাম *"
              className={inputClass}
            />
            <input
              name="phone"
              required
              placeholder="মোবাইল *"
              className={inputClass}
            />
            <input
              name="fatherName"
              placeholder="পিতার নাম"
              className={inputClass}
            />
            <input
              name="applyingClass"
              placeholder="যে ক্লাসে ভর্তি"
              className={inputClass}
            />
            <input
              name="previousSchool"
              placeholder="পূর্ববর্তী প্রতিষ্ঠান"
              className={inputClass}
            />
            <textarea
              name="notes"
              placeholder="অতিরিক্ত তথ্য"
              className="min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
            />
            {state.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "আবেদন জমা দিন"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
