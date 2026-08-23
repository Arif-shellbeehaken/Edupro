"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createRouteAction,
  assignTransportAction,
  type OpsState,
} from "@/application/use-cases/operations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function TransportForms({
  routes,
  students,
}: {
  routes: { id: string; name: string; assigned: number; capacity: number }[];
  students: { id: string; name: string; studentId: string }[];
}) {
  const [routeState, routeAction, routePending] = useActionState(
    createRouteAction,
    {} as OpsState
  );
  const [assignState, assignAction, assignPending] = useActionState(
    assignTransportAction,
    {} as OpsState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন রুট</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={routeAction} className="space-y-2">
            <input name="name" required placeholder="রুট নাম *" className={inputClass} />
            <input name="nameBn" placeholder="বাংলা নাম" className={inputClass} />
            <input name="vehicleNo" placeholder="গাড়ির নম্বর" className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <input name="driverName" placeholder="ড্রাইভার" className={inputClass} />
              <input name="driverPhone" placeholder="ফোন" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input name="monthlyFee" type="number" min={0} defaultValue={0} placeholder="মাসিক ফি" className={inputClass} />
              <input name="capacity" type="number" min={1} defaultValue={30} placeholder="ক্যাপাসিটি" className={inputClass} />
            </div>
            {routeState.error && <p className="text-xs text-red-600">{routeState.error}</p>}
            {routeState.success && <p className="text-xs text-emerald-600">রুট যোগ হয়েছে</p>}
            <Button type="submit" className="w-full" disabled={routePending}>
              {routePending ? <Loader2 className="h-4 w-4 animate-spin" /> : "রুট যোগ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">শিক্ষার্থী অ্যাসাইন</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={assignAction} className="space-y-2">
            <select name="routeId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                রুট *
              </option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.assigned}/{r.capacity})
                </option>
              ))}
            </select>
            <select name="studentId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                শিক্ষার্থী *
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
            <input name="pickupPoint" placeholder="পিকআপ পয়েন্ট" className={inputClass} />
            {assignState.error && <p className="text-xs text-red-600">{assignState.error}</p>}
            {assignState.success && (
              <p className="text-xs text-emerald-600">{assignState.message}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={assignPending || routes.length === 0 || students.length === 0}
            >
              {assignPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "অ্যাসাইন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
