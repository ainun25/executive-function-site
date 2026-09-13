import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { TrainingCategory, TrainingMaterial } from "@/types";
import { sampleTrainingMaterials } from "@/data/trainingMaterials";

interface TrainingMaterialRow {
  id: string;
  title: string;
  category: TrainingCategory;
  target_grade: string | null;
  difficulty: "쉬움" | "보통" | "어려움" | null;
  duration_minutes: number | null;
  description: string;
  materials: string | null;
  activity_steps: string | null;
  learning_goal: string | null;
  file_url: string | null;
  source: string | null;
}

function rowToMaterial(row: TrainingMaterialRow): TrainingMaterial {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    targetGrade: row.target_grade ?? "학년 정보 없음",
    difficulty: row.difficulty ?? "보통",
    durationMinutes: row.duration_minutes ?? 0,
    description: row.description,
    materials: row.materials,
    activitySteps: row.activity_steps,
    learningGoal: row.learning_goal,
    fileUrl: row.file_url,
    source: row.source,
  };
}

export async function fetchTrainingMaterials(): Promise<TrainingMaterial[]> {
  if (!isSupabaseConfigured || !supabase) return sampleTrainingMaterials;

  const { data, error } = await supabase
    .from("training_materials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("훈련자료를 불러오지 못했습니다:", error?.message);
    return sampleTrainingMaterials;
  }

  return (data as TrainingMaterialRow[]).map(rowToMaterial);
}

export interface TrainingMaterialInput {
  title: string;
  category: TrainingCategory;
  targetGrade: string;
  difficulty: "쉬움" | "보통" | "어려움";
  durationMinutes: number;
  description: string;
  materials: string | null;
  activitySteps: string | null;
  learningGoal: string | null;
  fileUrl: string | null;
  source: string | null;
}

function toRow(input: TrainingMaterialInput) {
  return {
    title: input.title,
    category: input.category,
    target_grade: input.targetGrade,
    difficulty: input.difficulty,
    duration_minutes: input.durationMinutes,
    description: input.description,
    materials: input.materials,
    activity_steps: input.activitySteps,
    learning_goal: input.learningGoal,
    file_url: input.fileUrl,
    source: input.source,
  };
}

export async function createTrainingMaterial(
  input: TrainingMaterialInput
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase.from("training_materials").insert(toRow(input));
  return { error: error?.message ?? null };
}

export async function updateTrainingMaterial(
  id: string,
  input: TrainingMaterialInput
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase.from("training_materials").update(toRow(input)).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteTrainingMaterial(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase가 설정되어 있지 않습니다." };
  const { error } = await supabase.from("training_materials").delete().eq("id", id);
  return { error: error?.message ?? null };
}
