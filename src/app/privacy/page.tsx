import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 보호 안내 | 실행기능 놀이터",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-extrabold text-slate-900">개인정보 보호 안내</h1>
      <p className="mt-4 text-slate-600">
        이 사이트는 초등학생을 대상으로 하므로, 개인정보를 최소한으로만 수집하도록 설계되었습니다.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">1. 수집하는 정보</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>참여자 식별자(participantId): 실명이 아니며, 이 브라우저가 자동으로 만든 임의의 값입니다.</li>
          <li>검사 문항별 응답, 반응시간, 정답 여부 등 수행과제 데이터</li>
          <li>기기 종류, 화면 크기, 브라우저 정보(데이터 품질 확인용, 개인 식별 목적 아님)</li>
        </ul>
        <p className="text-sm text-slate-500">
          이름, 주소, 전화번호, 학교명 등 개인을 특정할 수 있는 정보는 수집하지 않습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">2. 정보를 저장하는 곳</h2>
        <p className="text-sm text-slate-600">
          검사 결과는 이 브라우저(localStorage)에 저장되며, Supabase 데이터베이스에도 함께
          저장됩니다. 다른 사람의 브라우저나 다른 기기와는 공유되지 않습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">3. 정보를 사용하는 목적</h2>
        <p className="text-sm text-slate-600">
          수집된 정보는 이 사이트에서 검사 결과를 보여주고, 서비스 개선을 위한 통계를 만드는
          목적으로만 사용됩니다. 광고, 마케팅, 제3자 제공 목적으로 사용하지 않습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">4. 앞으로 필요한 절차</h2>
        <p className="text-sm text-slate-600">
          이 사이트는 교육·연구 목적의 프로토타입입니다. 실제 아동을 대상으로 한 정식 연구나
          서비스에 사용하려면 다음이 추가로 필요합니다.
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>보호자(법정대리인)의 사전 동의 절차</li>
          <li>공식적인 개인정보처리방침 수립 및 게시</li>
          <li>기관 연구윤리심의위원회(IRB)의 사전 검토</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">5. 검사 결과에 대한 안내</h2>
        <p className="text-sm text-slate-600">
          이 사이트의 검사는 실행기능의 일부 특성을 살펴보기 위한 교육·연구용 수행과제이며,
          의학적 또는 심리학적 진단을 목적으로 하지 않습니다. 표준화된 규준이 없는 상태이므로
          점수를 &ldquo;상위/평균/하위&rdquo;나 &ldquo;정상/위험&rdquo;처럼 평가하지 않습니다.
        </p>
      </section>
    </div>
  );
}
