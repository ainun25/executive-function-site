import type { AgeGroup, GradeCode } from "@/types";

// 학년 선택지 (입력 화면에 보이는 순서)
export const GRADE_OPTIONS: { code: GradeCode; label: string }[] = [
  { code: "preschool", label: "유치원 (예비초등)" },
  { code: "1", label: "초등 1학년" },
  { code: "2", label: "초등 2학년" },
  { code: "3", label: "초등 3학년" },
  { code: "4", label: "초등 4학년" },
  { code: "5", label: "초등 5학년" },
  { code: "6", label: "초등 6학년" },
];

export const AGE_GROUPS: AgeGroup[] = ["preschool", "lower", "upper"];

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  preschool: "예비초등",
  lower: "초등 저학년 (1~3학년)",
  upper: "초등 고학년 (4~6학년)",
};

// 표의 칸에 짧게 보여줄 때 쓰는 이름
export const AGE_GROUP_SHORT_LABELS: Record<AgeGroup, string> = {
  preschool: "유치원",
  lower: "초등 저학년",
  upper: "초등 고학년",
};

export function ageGroupShortLabel(ageGroup: string | null): string {
  return AGE_GROUP_SHORT_LABELS[ageGroup as AgeGroup] ?? "-";
}

// 학년 → 연령군. 유치원=예비초등, 초1~3=저학년, 초4~6=고학년.
export function gradeToAgeGroup(grade: GradeCode): AgeGroup {
  if (grade === "preschool") return "preschool";
  return Number(grade) <= 3 ? "lower" : "upper";
}

export function gradeLabel(grade: string | null): string {
  return GRADE_OPTIONS.find((option) => option.code === grade)?.label ?? "-";
}

export function ageGroupLabel(ageGroup: string | null): string {
  return AGE_GROUP_LABELS[ageGroup as AgeGroup] ?? "-";
}
