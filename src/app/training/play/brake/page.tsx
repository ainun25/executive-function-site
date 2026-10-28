import type { Metadata } from "next";
import GameShell from "@/components/play/GameShell";

export const metadata: Metadata = {
  title: "꼬마 자동차 브레이크 | 실행기능 놀이터",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <GameShell gameId="brake" />
    </div>
  );
}
