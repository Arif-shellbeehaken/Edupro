import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hrRepository } from "@/infrastructure/database/repositories/hr-repository";
import { StaffAttendanceForm } from "./attendance-forms";

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default async function StaffAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const date = sp.date || todayIso();
  const now = new Date();
  const year = Number(sp.year || now.getFullYear());
  const month = Number(sp.month || now.getMonth() + 1);

  let staff: Awaited<ReturnType<typeof hrRepository.listStaff>> = [];
  let marks: Awaited<ReturnType<typeof hrRepository.listStaffAttendance>> = [];
  let leaves: Awaited<ReturnType<typeof hrRepository.listApprovedLeavesForMonth>> = [];
  let error: string | null = null;

  try {
    staff = await hrRepository.listStaff({ status: "ACTIVE", take: 200 });
    marks = await hrRepository.listStaffAttendance({ date: new Date(date) });
    leaves = await hrRepository.listApprovedLeavesForMonth({ year, month });
  } catch (e) {
    error = e instanceof Error ? e.message : "ডেটা লোড ব্যর্থ";
  }

  const markMap = new Map(marks.map((m) => [m.staffId, m.status]));
  const rows = staff.map((s) => ({
    id: s.id,
    name: s.name,
    nameBn: s.nameBn,
    employeeId: s.employeeId,
    designation: s.designation,
    currentStatus: markMap.get(s.id),
  }));

  const present = marks.filter((m) => m.status === "PRESENT" || m.status === "LATE").length;
  const absent = marks.filter((m) => m.status === "ABSENT").length;

  // calendar days for month
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0 Sun
  // Bangladesh often starts Sat — keep Sun for simplicity
  const leaveByDay = new Map<number, string[]>();
  for (const lv of leaves) {
    const start = new Date(lv.startDate);
    const end = new Date(lv.endDate);
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(year, month - 1, d);
      if (cur >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
          cur <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) {
        const arr = leaveByDay.get(d) ?? [];
        arr.push(lv.staff.nameBn || lv.staff.name);
        leaveByDay.set(d, arr);
      }
    }
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("bn-BD", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page-pad">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">স্টাফ উপস্থিতি ও ছুটি ক্যালেন্ডার</h1>
          <p className="text-sm text-muted-foreground">দৈনিক মার্ক · মাসিক ছুটির দৃশ্য</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/tenant/admin/hr" className="underline">
            HR
          </Link>
          <Link href="/tenant/admin/hr/leave" className="underline">
            ছুটির আবেদন
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">আজ মার্ক</CardTitle>
          </CardHeader>
          <CardContent className="page-title">{marks.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">উপস্থিত/লেট</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-700">{present}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">অনুপস্থিত</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-red-700">{absent}</CardContent>
        </Card>
      </div>

      <form className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted-foreground">তারিখ</label>
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground"
        >
          দেখুন
        </button>
      </form>

      <StaffAttendanceForm date={date} staff={rows} />

      <Card>
        <CardHeader>
          <CardTitle>ছুটি ক্যালেন্ডার · {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="mb-4 flex flex-wrap gap-2">
            <input type="hidden" name="date" value={date} />
            <select
              name="month"
              defaultValue={month}
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleDateString("bn-BD", { month: "long" })}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="year"
              defaultValue={year}
              className="h-9 w-24 rounded-md border border-input bg-transparent px-2 text-sm"
            />
            <button type="submit" className="h-9 rounded-md border px-3 text-sm">
              মাস বদলান
            </button>
          </form>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"].map((d) => (
              <div key={d} className="py-1 font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const names = leaveByDay.get(day) ?? [];
              return (
                <div
                  key={day}
                  className="min-h-16 rounded-md border bg-muted/30 p-1 text-left"
                >
                  <span className="font-medium tabular-nums">{day}</span>
                  {names.slice(0, 2).map((n) => (
                    <Badge key={n + day} variant="secondary" className="mt-0.5 block truncate text-[10px]">
                      {n}
                    </Badge>
                  ))}
                  {names.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{names.length - 2}</span>
                  )}
                </div>
              );
            })}
          </div>
          {leaves.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">এই মাসে অনুমোদিত ছুটি নেই</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
