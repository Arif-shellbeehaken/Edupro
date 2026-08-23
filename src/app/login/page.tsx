"use client";

import Link from "next/link";
import { useState } from "react";
import { Mosque, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "teacher" | "parent" | "student" | "super">("admin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-background px-4 dark:from-emerald-950/20">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Mosque className="h-5 w-5" />
        </div>
        <span className="text-2xl font-bold">Edupro</span>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">লগইন করুন</CardTitle>
          <CardDescription>
            আপনার অ্যাকাউন্টে প্রবেশ করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { id: "admin", label: "অ্যাডমিন" },
              { id: "teacher", label: "শিক্ষক" },
              { id: "parent", label: "অভিভাবক" },
              { id: "student", label: "শিক্ষার্থী" },
              { id: "super", label: "সুপার অ্যাডমিন" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as typeof role)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  role === r.id
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-border hover:bg-muted"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              // Demo redirect based on role
              if (role === "super") {
                window.location.href = "/super-admin/dashboard";
              } else if (role === "admin") {
                window.location.href = "/tenant/admin/dashboard";
              } else {
                window.location.href = "/tenant/admin/dashboard";
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                ইমেইল / মোবাইল
              </label>
              <input
                id="email"
                type="text"
                placeholder="admin@school.edu.bd"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                defaultValue={
                  role === "super"
                    ? "super@edupro.app"
                    : role === "admin"
                    ? "admin@demo-madrasah.edu.bd"
                    : "user@demo.edu.bd"
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  defaultValue="demo1234"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-zinc-300" />
                <span className="text-muted-foreground">মনে রাখুন</span>
              </label>
              <a href="#" className="text-emerald-600 hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg">
              লগইন করুন
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            নতুন প্রতিষ্ঠান?{" "}
            <Link href="/" className="font-medium text-emerald-600 hover:underline">
              ফ্রি ট্রায়াল শুরু করুন
            </Link>
          </p>
        </CardContent>
      </Card>

      <Link
        href="/"
        className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        হোমে ফিরে যান
      </Link>
    </div>
  );
}
