"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NagadPayButton({
  invoiceId,
  disabled,
}: {
  invoiceId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/nagad/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nagad ব্যর্থ");
        return;
      }
      window.location.href = data.nagadURL;
    } catch {
      setError("নেটওয়ার্ক ত্রুটি");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || loading}
        onClick={handlePay}
        className="border-orange-300 text-orange-700 hover:bg-orange-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Nagad"}
      </Button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
