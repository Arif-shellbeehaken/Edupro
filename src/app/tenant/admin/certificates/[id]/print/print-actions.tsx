"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PrintActions() {
  return (
    <div className="flex items-center justify-center gap-3 py-4 print:hidden">
      <Button onClick={() => window.print()}>প্রিন্ট / PDF সেভ</Button>
      <Button variant="outline" asChild>
        <Link href="/tenant/admin/certificates">ফিরে যান</Link>
      </Button>
    </div>
  );
}
