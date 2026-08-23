"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  setupTwoFactorAction,
  enableTwoFactorAction,
  disableTwoFactorAction,
  type TwoFactorState,
} from "@/application/use-cases/security/two-factor";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function TwoFactorForms({
  enabled,
  hasSecret,
}: {
  enabled: boolean;
  hasSecret: boolean;
}) {
  const [setupState, setupAction, setupPending] = useActionState(
    setupTwoFactorAction,
    {} as TwoFactorState
  );
  const [enableState, enableAction, enablePending] = useActionState(
    enableTwoFactorAction,
    {} as TwoFactorState
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableTwoFactorAction,
    {} as TwoFactorState
  );

  const secret = setupState.secret;
  const uri = setupState.uri;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Two-Factor Authentication (TOTP)</CardTitle>
          <CardDescription>
            Google Authenticator / Authy — ৩০ সেকেন্ড কোড
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!enabled && (
            <>
              <form action={setupAction}>
                <Button type="submit" variant="outline" disabled={setupPending}>
                  {setupPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "1. Secret তৈরি"}
                </Button>
              </form>
              {(secret || hasSecret) && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  {secret && (
                    <>
                      <p className="font-mono text-xs break-all">Secret: {secret}</p>
                      {uri && (
                        <p className="text-xs text-muted-foreground break-all">URI: {uri}</p>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Authenticator অ্যাপে ম্যানুয়ালি secret যোগ করুন, তারপর কোড দিন।
                  </p>
                  <form action={enableAction} className="flex gap-2">
                    <input
                      name="token"
                      required
                      placeholder="৬-ডিজিট কোড"
                      className={inputClass}
                      maxLength={6}
                    />
                    <Button type="submit" disabled={enablePending}>
                      {enablePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "সক্রিয়"}
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
          {enabled && (
            <form action={disableAction} className="space-y-2">
              <p className="text-sm text-emerald-700">2FA চালু আছে</p>
              <input name="token" required placeholder="কোড দিয়ে বন্ধ করুন" className={inputClass} />
              <Button type="submit" variant="destructive" disabled={disablePending}>
                {disablePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "2FA বন্ধ"}
              </Button>
            </form>
          )}
          {(setupState.message || enableState.message || disableState.message) && (
            <p className="text-xs text-emerald-600">
              {setupState.message || enableState.message || disableState.message}
            </p>
          )}
          {(setupState.error || enableState.error || disableState.error) && (
            <p className="text-xs text-red-600">
              {setupState.error || enableState.error || disableState.error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
