"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  linkSiblingsAction,
  addStudentDocumentAction,
  type SiblingState,
} from "@/application/use-cases/students/sibling";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

export default function SiblingsPage() {
  const [linkState, linkAction, linkPending] = useActionState(
    linkSiblingsAction,
    {} as SiblingState
  );
  const [docState, docAction, docPending] = useActionState(
    addStudentDocumentAction,
    {} as SiblingState
  );

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mb-4">
        <Link
          href="/tenant/admin/students"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← শিক্ষার্থী তালিকা
        </Link>
        <h1 className="mt-2 text-xl font-semibold">সিবলিং ও ডকুমেন্ট ভল্ট</h1>
        <p className="text-sm text-muted-foreground">
          একই পরিবারের শিক্ষার্থী লিংক + সার্টিফিকেট/ছবি URL সংরক্ষণ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">সিবলিং লিংক</CardTitle>
            <CardDescription>দুই studentId এক family group-এ</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={linkAction} className="space-y-3">
              <input
                name="studentIdA"
                required
                placeholder="Student ID A"
                className={inputClass}
              />
              <input
                name="studentIdB"
                required
                placeholder="Student ID B"
                className={inputClass}
              />
              {linkState.error && (
                <p className="text-sm text-red-600">{linkState.error}</p>
              )}
              {linkState.success && (
                <p className="text-sm text-emerald-600">{linkState.message}</p>
              )}
              <Button type="submit" disabled={linkPending}>
                {linkPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "লিংক করুন"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ডকুমেন্ট ভল্ট</CardTitle>
            <CardDescription>URL-ভিত্তিক মেটাডাটা (S3/local upload পরের ধাপ)</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={docAction} className="space-y-3">
              <input
                name="studentId"
                required
                placeholder="Student ID"
                className={inputClass}
              />
              <input
                name="docName"
                required
                placeholder="নথি নাম (জন্মনিবন্ধন)"
                className={inputClass}
              />
              <input
                name="docUrl"
                required
                placeholder="https://..."
                className={inputClass}
              />
              <select name="docType" className={inputClass} defaultValue="CERTIFICATE">
                <option value="CERTIFICATE">সার্টিফিকেট</option>
                <option value="PHOTO">ছবি</option>
                <option value="NID">NID</option>
                <option value="OTHER">অন্যান্য</option>
              </select>
              {docState.error && (
                <p className="text-sm text-red-600">{docState.error}</p>
              )}
              {docState.success && (
                <p className="text-sm text-emerald-600">{docState.message}</p>
              )}
              <Button type="submit" disabled={docPending}>
                {docPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "সংরক্ষণ"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
