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
  createRoomAction,
  allocateRoomAction,
  publishMessMenuAction,
  type OpsState,
} from "@/application/use-cases/operations/actions";

const inputClass =
  "flex h-10 w-full rounded-lg border border-zinc-200 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function HostelForms({
  rooms,
  students,
}: {
  rooms: { id: string; label: string }[];
  students: { id: string; name: string; studentId: string }[];
}) {
  const [roomState, roomAction, roomPending] = useActionState(createRoomAction, {} as OpsState);
  const [allocState, allocAction, allocPending] = useActionState(
    allocateRoomAction,
    {} as OpsState
  );
  const [menuState, menuAction, menuPending] = useActionState(
    publishMessMenuAction,
    {} as OpsState
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন রুম</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={roomAction} className="space-y-2">
            <input name="roomNumber" required placeholder="রুম নং *" className={inputClass} />
            <input name="blockName" placeholder="ব্লক (A/B)" className={inputClass} />
            <div className="grid grid-cols-2 gap-2">
              <input name="capacity" type="number" min={1} defaultValue={4} className={inputClass} />
              <input name="monthlyFee" type="number" min={0} defaultValue={0} placeholder="মাসিক ফি" className={inputClass} />
            </div>
            <select name="roomType" className={inputClass} defaultValue="SHARED">
              <option value="SHARED">শেয়ার্ড</option>
              <option value="SINGLE">সিঙ্গেল</option>
              <option value="DORM">ডরমিটরি</option>
            </select>
            {roomState.error && <p className="text-xs text-red-600">{roomState.error}</p>}
            {roomState.success && <p className="text-xs text-emerald-600">রুম যোগ হয়েছে</p>}
            <Button type="submit" className="w-full" disabled={roomPending}>
              {roomPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "রুম যোগ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">রুম অ্যালোকেট · অভিভাবক SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={allocAction} className="space-y-2">
            <select name="roomId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                রুম *
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
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
            <input name="notes" placeholder="নোট" className={inputClass} />
            {allocState.error && <p className="text-xs text-red-600">{allocState.error}</p>}
            {allocState.success && (
              <p className="text-xs text-emerald-600">{allocState.message}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={allocPending || rooms.length === 0 || students.length === 0}
            >
              {allocPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "অ্যালোকেট"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">মেস মেনু · SMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={menuAction} className="grid gap-2 sm:grid-cols-2">
            <input name="menuDate" type="date" required className={inputClass} />
            <input name="breakfast" placeholder="সকালের খাবার" className={inputClass} />
            <input name="lunch" placeholder="দুপুরের খাবার" className={inputClass} />
            <input name="dinner" placeholder="রাতের খাবার" className={inputClass} />
            <Button type="submit" disabled={menuPending} className="sm:col-span-2">
              {menuPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "মেনু প্রকাশ + SMS"}
            </Button>
            {menuState.error && (
              <p className="text-xs text-red-600 sm:col-span-2">{menuState.error}</p>
            )}
            {menuState.success && (
              <p className="text-xs text-emerald-600 sm:col-span-2">{menuState.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
