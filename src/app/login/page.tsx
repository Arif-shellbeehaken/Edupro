"use client";

import Link from "next/link";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mosque, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  loginAction,
  verify2faAction,
  type LoginState,
} from "@/application/use-cases/auth/login";

const initialState: LoginState = {};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCache, setPasswordCache] = useState("");
  const [emailCache, setEmailCache] = useState("");
  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    initialState
  );
  const [otpState, otpFormAction, otpPending] = useActionState(
    verify2faAction,
    initialState
  );

  const requires2FA = loginState.requires2FA || otpState.requires2FA;
  const emailFor2FA = loginState.email || otpState.email || emailCache;
  const activeError = requires2FA ? otpState.error : loginState.error;
  const isPending = loginPending || otpPending;
  const { toast } = useToast();

  useEffect(() => {
    const s = otpState.success ? otpState : loginState;
    if (s.success && s.redirectTo) {
      toast({ title: "লগইন সফল", kind: "success" });
      router.push(s.redirectTo);
      router.refresh();
    }
  }, [loginState, otpState, router, toast]);

  useEffect(() => {
    const err = requires2FA ? otpState.error : loginState.error;
    if (err) toast({ title: "লগইন ব্যর্থ", description: err, kind: "error" });
  }, [loginState.error, otpState.error, requires2FA, toast]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-background px-4 py-8 dark:from-emerald-950/20">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Mosque className="h-5 w-5" />
        </div>
        <span className="text-2xl font-bold">Edupro</span>
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {requires2FA ? "দুই-ধাপ যাচাই" : "লগইন করুন"}
          </CardTitle>
          <CardDescription>
            {requires2FA
              ? "Authenticator অ্যাপের ৬-ডিজিট কোড দিন"
              : "আপনার অ্যাকাউন্টে প্রবেশ করুন"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!requires2FA ? (
            <form action={loginFormAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  ইমেইল
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={emailCache}
                  onChange={(e) => setEmailCache(e.target.value)}
                  placeholder="admin@demo-madrasah.edu.bd"
                  className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    defaultValue={passwordCache}
                    onChange={(e) => setPasswordCache(e.target.value)}
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {activeError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{activeError}</div>
              )}
              <Button type="submit" className="w-full min-h-11" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  "লগইন করুন"
                )}
              </Button>
            </form>
          ) : (
            <form action={otpFormAction} className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{emailFor2FA}</span>
              </div>
              <input type="hidden" name="email" value={emailFor2FA} />
              <input type="hidden" name="password" value={passwordCache} />
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="token">
                  Authenticator কোড
                </label>
                <input
                  id="token"
                  name="token"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={8}
                  placeholder="000000"
                  className="flex h-12 w-full rounded-lg border border-border bg-background px-3 py-2 text-center text-2xl tracking-[0.4em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {activeError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{activeError}</div>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    যাচাই হচ্ছে...
                  </>
                ) : (
                  "যাচাই করে প্রবেশ"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Security পেজ থেকে 2FA চালু থাকলেই এই ধাপ আসে
              </p>
            </form>
          )}

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">ডেমো অ্যাকাউন্ট:</p>
            <p>Super Admin → super@edupro.app / Super@1234</p>
            <p>Institution Admin → admin@demo-madrasah.edu.bd / Admin@1234</p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            নতুন প্রতিষ্ঠান?{" "}
            <Link href="/" className="font-medium text-emerald-600 hover:underline">
              ফ্রি ট্রায়াল শুরু করুন
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
