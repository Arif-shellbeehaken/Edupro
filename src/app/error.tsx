"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">অ্যাপ্লিকেশন ত্রুটি</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        অপ্রত্যাশিত সমস্যা হয়েছে। পেজ রিফ্রেশ করুন।
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>রিট্রাই</Button>
        <Button variant="outline" asChild>
          <Link href="/">হোম</Link>
        </Button>
      </div>
    </div>
  );
}
