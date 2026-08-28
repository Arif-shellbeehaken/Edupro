import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-primary">৪০৪</p>
      <h1 className="mt-4 text-xl font-semibold">পেজ পাওয়া যায়নি</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        লিংকটি ভুল হতে পারে অথবা পেজ সরিয়ে ফেলা হয়েছে।
      </p>
      <Button className="mt-6" asChild>
        <Link href="/">হোমে ফিরে যান</Link>
      </Button>
    </div>
  );
}
