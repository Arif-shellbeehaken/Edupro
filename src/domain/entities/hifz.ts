import { HifzStream, TilawatQuality } from "../enums";

/**
 * Hifz Bounded Context
 * The strongest differentiator of Edupro.
 *
 * Streams:
 * - SABAK  → Today's new memorization
 * - SABKI  → Recent revision
 * - MANZIL → Older revision cycles
 */

export interface HifzProgress {
  id: string;
  tenantId: string;
  studentId: string;

  // Overall progress
  totalJuzCompleted: number;        // 0-30
  totalPagesMemorized: number;      // approx 0-604
  currentJuz: number;
  currentPage: number;
  currentSurah?: string | null;

  // Quality metrics
  averageQualityScore: number;      // 1.0 - 5.0
  lastEntryDate?: Date | null;

  // Meta
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Single Hifz Entry (daily log by teacher)
 */
export interface HifzEntry {
  id: string;
  tenantId: string;
  studentId: string;
  teacherId: string;                // who took the sabak/revision

  date: Date;
  stream: HifzStream;

  // What was covered
  fromJuz: number;
  fromPage: number;
  fromSurah?: string | null;
  fromAyah?: number | null;

  toJuz: number;
  toPage: number;
  toSurah?: string | null;
  toAyah?: number | null;

  // Evaluation
  quality: TilawatQuality;
  mistakesCount?: number | null;
  teacherNote?: string | null;

  // Meta
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHifzEntryInput {
  tenantId: string;
  studentId: string;
  teacherId: string;
  date: Date;
  stream: HifzStream;
  fromJuz: number;
  fromPage: number;
  toJuz: number;
  toPage: number;
  fromSurah?: string;
  toSurah?: string;
  quality: TilawatQuality;
  mistakesCount?: number;
  teacherNote?: string;
}

/**
 * Helper: Convert page number (1-604) to approximate Juz
 */
export function pageToJuz(page: number): number {
  if (page < 1 || page > 604) return 0;
  return Math.min(30, Math.ceil(page / 20.13));
}
