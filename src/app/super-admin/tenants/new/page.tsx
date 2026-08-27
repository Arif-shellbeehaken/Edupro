"use client";

import { useActionState, useEffect, useState } from "react";
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
  provisionTenantAction,
  type ProvisionTenantState,
} from "@/application/use-cases/tenant/provision";

const initial: ProvisionTenantState = {};

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export default function NewTenantPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(provisionTenantAction, initial);
  const [slug, setSlug] = useState("");
  function slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
  }


  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => {
        router.push("/super-admin/tenants");
        router.refresh();
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/super-admin/tenants"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          তালিকায় ফিরে যান
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>নতুন প্রতিষ্ঠান প্রভিশন</CardTitle>
            <CardDescription>
              টেনান্ট + অ্যাডমিন ইউজার + একাডেমিক ইয়ার একসাথে তৈরি হবে (১৪ দিন ট্রায়াল)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              {/* Institution */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-emerald-700">প্রতিষ্ঠানের তথ্য</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium" htmlFor="name">
                      নাম (ইংরেজি/বাংলা) *
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      className={inputClass}
                      placeholder="Darul Ulum Madrasah"
                      onChange={(e) => {
                        if (!slug || slug === slugify(e.target.value.slice(0, -1))) {
                          setSlug(slugify(e.target.value));
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="nameBn">
                      বাংলা নাম
                    </label>
                    <input id="nameBn" name="nameBn" className={inputClass} placeholder="দারুল উলূম মাদ্রাসা" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="slug">
                      স্লাগ (সাবডোমেইন) *
                    </label>
                    <input
                      id="slug"
                      name="slug"
                      required
                      pattern="[a-z0-9\-]+"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className={inputClass}
                      placeholder="darul-ulum"
                    />
                    <p className="text-[11px] text-muted-foreground">slug.edupro.app</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="type">
                      ধরন *
                    </label>
                    <select id="type" name="type" required className={inputClass} defaultValue="QAWMI_MADRASAH">
                      <option value="SCHOOL">স্কুল</option>
                      <option value="COLLEGE">কলেজ</option>
                      <option value="ALIA_MADRASAH">আলিয়া মাদ্রাসা</option>
                      <option value="QAWMI_MADRASAH">কওমি মাদ্রাসা</option>
                      <option value="MIXED">মিশ্র</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="plan">
                      প্ল্যান
                    </label>
                    <select id="plan" name="plan" className={inputClass} defaultValue="BASIC">
                      <option value="BASIC">Basic</option>
                      <option value="STANDARD">Standard</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="phone">
                      ফোন
                    </label>
                    <input id="phone" name="phone" className={inputClass} placeholder="017XXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">
                      ইমেইল
                    </label>
                    <input id="email" name="email" type="email" className={inputClass} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium" htmlFor="address">
                      ঠিকানা
                    </label>
                    <input id="address" name="address" className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="district">
                      জেলা
                    </label>
                    <input id="district" name="district" className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="division">
                      বিভাগ
                    </label>
                    <input id="division" name="division" className={inputClass} />
                  </div>
                </div>
              </fieldset>

              {/* Admin */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-emerald-700">প্রতিষ্ঠান অ্যাডমিন</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="adminName">
                      নাম *
                    </label>
                    <input id="adminName" name="adminName" required className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="adminEmail">
                      ইমেইল *
                    </label>
                    <input id="adminEmail" name="adminEmail" type="email" required className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="adminPhone">
                      ফোন
                    </label>
                    <input id="adminPhone" name="adminPhone" className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="adminPassword">
                      পাসওয়ার্ড *
                    </label>
                    <input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      required
                      minLength={8}
                      className={inputClass}
                      placeholder="কমপক্ষে ৮ অক্ষর"
                    />
                  </div>
                </div>
              </fieldset>

              {state.success && state.message && (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {state.message}
                </p>
              )}
              {state.error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {state.error}
                </div>
              )}

              {state.success && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  সফল! স্লাগ: {state.slug}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  "প্রতিষ্ঠান তৈরি করুন"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
