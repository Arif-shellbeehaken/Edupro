/** Bangladesh-style letter grade + grade point (0–5 scale common in many BD schools). */
export function letterGrade(obtained: number, full: number): string {
  if (full <= 0) return "—";
  const pct = (obtained / full) * 100;
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "A-";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  if (pct >= 33) return "D";
  return "F";
}

export function gradePoint(grade: string): number {
  switch (grade) {
    case "A+":
      return 5.0;
    case "A":
      return 4.0;
    case "A-":
      return 3.5;
    case "B":
      return 3.0;
    case "C":
      return 2.0;
    case "D":
      return 1.0;
    default:
      return 0;
  }
}

export function computeGpa(
  rows: { obtained: number; full: number; grade?: string | null }[]
): { totalObtained: number; totalFull: number; gpa: number; letter: string } {
  if (rows.length === 0) {
    return { totalObtained: 0, totalFull: 0, gpa: 0, letter: "—" };
  }
  let totalObtained = 0;
  let totalFull = 0;
  let gpSum = 0;
  for (const r of rows) {
    totalObtained += r.obtained;
    totalFull += r.full;
    const g = r.grade || letterGrade(r.obtained, r.full);
    gpSum += gradePoint(g);
  }
  const gpa = Math.round((gpSum / rows.length) * 100) / 100;
  const overall = letterGrade(totalObtained, totalFull);
  return { totalObtained, totalFull, gpa, letter: overall };
}
