"use client";

import { useState } from "react";
import ParticipantInfoForm from "./ParticipantInfoForm";
import type { ParticipantInfo } from "@/types";

interface ParticipantGateProps {
  children: (participant: ParticipantInfo) => React.ReactNode;
}

/**
 * 검사 페이지를 감싸서, 이름/나이 입력이 끝나기 전까지는 검사 화면 대신
 * ParticipantInfoForm을 보여줍니다. 입력이 끝나면 참여자 정보를 children에 전달합니다.
 */
export default function ParticipantGate({ children }: ParticipantGateProps) {
  const [participant, setParticipant] = useState<ParticipantInfo | null>(null);

  if (!participant) {
    return <ParticipantInfoForm onSubmit={setParticipant} />;
  }

  return <>{children(participant)}</>;
}
