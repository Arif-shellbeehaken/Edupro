"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center page-pad text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">কিছু সমস্যা হয়েছে</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        এই পেজ লোড করতে ব্যর্থ। আবার চেষ্টা করুন বা ড্যাশবোর্ডে ফিরে যান।
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>আবার চেষ্টা</Button>
        <Button variant="outline" asChild>
          <Link href="/tenant/admin/dashboard">ড্যাশবোর্ড</Link>
        </Button>
      </div>
    </div>
  );
}
