"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createExamAction,
  createSubjectAction,
  enterMarkAction,
  type CreateExamState,
  type CreateSubjectState,
  type EnterMarkState,
} from "@/application/use-cases/exam/create-exam";

const inputClass =
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ExamOpt = { id: string; name: string; type: string };
type SubjectOpt = { id: string; name: string; fullMarks: number };
type StudentOpt = { id: string; name: string; studentId: string };

export function ExamForms({
  exams,
  subjects,
  students,
}: {
  exams: ExamOpt[];
  subjects: SubjectOpt[];
  students: StudentOpt[];
}) {
  const [examState, examAction, examPending] = useActionState(
    createExamAction,
    {} as CreateExamState
  );
  const [subState, subAction, subPending] = useActionState(
    createSubjectAction,
    {} as CreateSubjectState
  );
  const [markState, markAction, markPending] = useActionState(
    enterMarkAction,
    {} as EnterMarkState
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">নতুন পরীক্ষা</CardTitle>
          <CardDescription>মিড / ফাইনাল / হিফজ টেস্ট</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={examAction} className="space-y-3">
            <input name="name" required placeholder="নাম *" className={inputClass} />
            <input name="nameBn" placeholder="বাংলা নাম" className={inputClass} />
            <select name="examType" className={inputClass} defaultValue="MID_TERM">
              <option value="CLASS_TEST">ক্লাস টেস্ট</option>
              <option value="MID_TERM">মিড টার্ম</option>
              <option value="FINAL">ফাইনাল</option>
              <option value="BOARD">বোর্ড</option>
              <option value="HIFZ_TEST">হিফজ টেস্ট</option>
            </select>
            <input name="startDate" type="date" className={inputClass} />
            {examState.error && (
              <p className="text-xs text-red-600">{examState.error}</p>
            )}
            {examState.success && (
              <p className="text-xs text-emerald-600">
                {examState.message || "পরীক্ষা তৈরি হয়েছে"}
              </p>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notify" defaultChecked />
              অভিভাবককে সূচি SMS
            </label>
            <Button type="submit" className="w-full" disabled={examPending}>
              {examPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "তৈরি করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">বিষয় যোগ</CardTitle>
          <CardDescription>Subject master</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={subAction} className="space-y-3">
            <input name="name" required placeholder="বিষয়ের নাম *" className={inputClass} />
            <input name="nameBn" placeholder="বাংলা নাম" className={inputClass} />
            <input name="code" placeholder="কোড (BAN-101)" className={inputClass} />
            <input
              name="fullMarks"
              type="number"
              defaultValue={100}
              placeholder="পূর্ণ নম্বর"
              className={inputClass}
            />
            {subState.error && <p className="text-xs text-red-600">{subState.error}</p>}
            {subState.success && (
              <p className="text-xs text-emerald-600">বিষয় যোগ হয়েছে</p>
            )}
            <Button type="submit" className="w-full" disabled={subPending}>
              {subPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "বিষয় যোগ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">মার্ক এন্ট্রি</CardTitle>
          <CardDescription>গ্রেড অটো (A+ … F)</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={markAction} className="space-y-3">
            <select name="examId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                পরীক্ষা *
              </option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
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
            <select name="subjectId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                বিষয় *
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.fullMarks})
                </option>
              ))}
            </select>
            <input
              name="marksObtained"
              type="number"
              min={0}
              required
              placeholder="প্রাপ্ত নম্বর *"
              className={inputClass}
            />
            {markState.error && (
              <p className="text-xs text-red-600">{markState.error}</p>
            )}
            {markState.success && (
              <p className="text-xs text-emerald-600">মার্ক সংরক্ষিত</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={markPending || exams.length === 0 || subjects.length === 0}
            >
              {markPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "মার্ক সেভ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
