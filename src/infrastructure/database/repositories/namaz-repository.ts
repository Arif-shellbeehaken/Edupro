import { prisma } from "@/infrastructure/database/prisma";
import { requireTenantId } from "@/infrastructure/tenancy/tenant-context";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export const namazRepository = {
  async listForDate(date: Date, tenantId?: string) {
    const tid = tenantId ?? requireTenantId();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return prisma.namazRecord.findMany({
      where: { tenantId: tid, date: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  },

  async upsertDay(data: {
    tenantId: string;
    studentId: string;
    date: Date;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    notes?: string;
    markedById?: string;
  }) {
    const day = new Date(data.date);
    day.setHours(12, 0, 0, 0);

    return prisma.namazRecord.upsert({
      where: {
        tenantId_studentId_date: {
          tenantId: data.tenantId,
          studentId: data.studentId,
          date: day,
        },
      },
      update: {
        fajr: data.fajr,
        dhuhr: data.dhuhr,
        asr: data.asr,
        maghrib: data.maghrib,
        isha: data.isha,
        notes: data.notes,
        markedById: data.markedById,
      },
      create: {
        tenantId: data.tenantId,
        studentId: data.studentId,
        date: day,
        fajr: data.fajr,
        dhuhr: data.dhuhr,
        asr: data.asr,
        maghrib: data.maghrib,
        isha: data.isha,
        notes: data.notes,
        markedById: data.markedById,
      },
    });
  },

  async summaryForDate(date: Date, tenantId?: string) {
    const records = await this.listForDate(date, tenantId);
    const summary: Record<string, { present: number; total: number }> = {};
    for (const p of PRAYERS) {
      summary[p] = { present: 0, total: records.length };
    }
    for (const r of records) {
      for (const p of PRAYERS) {
        const v = r[p];
        if (v === "PRESENT" || v === "LATE") summary[p].present += 1;
      }
    }
    return summary;
  },
};

/** Approximate Hijri date string (Kuwaiti algorithm) for display */
export function approximateHijri(date = new Date()): string {
  const gd = date.getDate();
  const gm = date.getMonth() + 1;
  const gy = date.getFullYear();

  let y = gy;
  let m = gm;
  let d = gd;
  if (m < 3) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    b -
    1524.5;
  const islamicJd = Math.floor(jd - 1948439.5);
  const hijriYear = Math.floor((30 * islamicJd + 10646) / 10631);
  const hijriMonth =
    Math.min(
      12,
      Math.ceil((islamicJd - 29 - namazHijriEpoch(hijriYear)) / 29.5) + 1
    ) || 1;
  const monthStart = namazHijriEpoch(hijriYear) + Math.ceil(29.5 * (hijriMonth - 1));
  const hijriDay = islamicJd - monthStart + 1;

  const months = [
    "Muharram",
    "Safar",
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    "Jumada al-Awwal",
    "Jumada al-Thani",
    "Rajab",
    "Sha'ban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qi'dah",
    "Dhu al-Hijjah",
  ];
  const mi = Math.max(0, Math.min(11, hijriMonth - 1));
  return `${Math.max(1, Math.min(30, Math.floor(hijriDay)))} ${months[mi]} ${hijriYear} AH`;
}

function namazHijriEpoch(year: number) {
  return Math.floor((year - 1) * 354.36667 + 0.5);
}
