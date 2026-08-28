"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Shows when browser reports offline — production UX for weak networks */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function update() {
      setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[300] flex items-center justify-center gap-2 bg-amber-600 px-3 py-2 text-center text-sm font-medium text-white shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      ইন্টারনেট সংযোগ নেই — কিছু ফিচার অফলাইনে কাজ নাও করতে পারে
    </div>
  );
}
