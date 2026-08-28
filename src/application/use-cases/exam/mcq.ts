"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/infrastructure/auth/auth";
import { prisma } from "@/infrastructure/database/prisma";

export type McqState = {
  error?: string;
  success?: boolean;
  message?: string;
  score?: number;
  total?: number;
};

/** Auto-grade MCQ answers against question bank correctAnswer */
export async function submitMcqAction(
  _prev: McqState,
  formData: FormData
): Promise<McqState> {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };
  const tid = session.user.tenantId;
  const subject = String(formData.get("subject") || "").trim();
  const studentCode = String(formData.get("studentId") || "").trim();
  if (!subject || !studentCode) return { error: "subject ও studentId দিন" };

  try {
    const student = await prisma.student.findFirst({
      where: { tenantId: tid, studentId: studentCode, deletedAt: null },
    });
    if (!student) return { error: "শিক্ষার্থী পাওয়া যায়নি" };

    const questions = await prisma.questionBankItem.findMany({
      where: { tenantId: tid, subject, questionType: "MCQ" },
      take: 50,
    });
    if (questions.length === 0) {
      return { error: "এই বিষয়ে MCQ নেই — আগে question bank এ যোগ করুন" };
    }

    let score = 0;
    let total = 0;
    for (const q of questions) {
      total += q.marks;
      const ans = String(formData.get(`q_${q.id}`) || "").trim();
      if (
        q.correctAnswer &&
        ans.toLowerCase() === q.correctAnswer.trim().toLowerCase()
      ) {
        score += q.marks;
      }
    }

    // Optional: store as exam mark if an open CLASS_TEST exam exists
    const exam = await prisma.exam.findFirst({
      where: {
        tenantId: tid,
        examType: "CLASS_TEST",
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const subjectRow = await prisma.subject.findFirst({
      where: { tenantId: tid, name: subject },
    });
    if (exam && subjectRow) {
      const existing = await prisma.examMark.findFirst({
        where: {
          tenantId: tid,
          examId: exam.id,
          studentId: student.id,
          subjectId: subjectRow.id,
        },
      });
      if (existing) {
        await prisma.examMark.update({
          where: { id: existing.id },
          data: { marksObtained: score },
        });
      } else {
        await prisma.examMark.create({
          data: {
            tenantId: tid,
            examId: exam.id,
            studentId: student.id,
            subjectId: subjectRow.id,
            marksObtained: score,
            fullMarks: total,
          },
        });
      }
    }

    revalidatePath("/tenant/admin/exams");
    revalidatePath("/tenant/admin/exams/mcq");
    return {
      success: true,
      score,
      total,
      message: `স্কোর: ${score} / ${total}`,
    };
  } catch (e) {
    console.error("mcq", e);
    return { error: "গ্রেডিং ব্যর্থ" };
  }
}
