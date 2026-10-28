import type { Metadata } from "next";
import EarthGuardGame from "@/components/play/EarthGuardGame";

export const metadata: Metadata = {
  title: "지구 수호대 작전 | 실행기능 놀이터",
};

export default function EarthGuardPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <EarthGuardGame />
    </div>
  );
}
