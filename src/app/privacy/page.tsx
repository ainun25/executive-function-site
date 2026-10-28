import type { Metadata } from "next";
import { privacyConfig } from "@/data/privacyConfig";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 실행기능 놀이터",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

function Dots({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden="true">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const MISSING = <span className="font-semibold text-amber-600">(공개 전에 기재 필요)</span>;

/**
 * 개인정보처리방침. 운영자/연락처/보관기간은 src/data/privacyConfig.ts 한 곳에서 관리합니다.
 * ⚠️ 이 문서는 법률 자문이 아닙니다. 공개 전에 운영 정보를 채우고, 소속 기관이 있다면 기관의 검토를 받으세요.
 */
export default function PrivacyPage() {
  const { operatorName, contactEmail, retentionPeriod, effectiveDate } = privacyConfig;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-extrabold text-slate-900">개인정보처리방침</h1>
      <p className="mt-4 text-slate-600">
        &quot;실행기능 놀이터&quot;(이하 &quot;이 사이트&quot;)는 유치원·초등 아동이 이용하는 사이트이므로, 개인정보를 꼭
        필요한 만큼만 받고 안전하게 다룹니다. 이 문서는 어떤 정보를 왜 받고, 얼마나 보관하며, 어떻게 지우는지
        설명합니다.
      </p>
      <p className="mt-2 text-xs text-slate-400">시행일: {effectiveDate}</p>

      <Section title="1. 처리하는 개인정보와 목적">
        <p className="font-semibold text-slate-700">검사를 이용할 때 (보호자 동의 후)</p>
        <Dots
          items={[
            "이름, 만 나이(만 O세 O개월), 학년(유치원/초등 1~6학년)",
            "검사 문항별 응답, 반응시간, 정답 여부 등 수행과제 결과",
            "참여자 식별자: 이 브라우저가 자동으로 만든 임의의 값(이름이 아닙니다)",
            "기기 종류, 화면 크기, 브라우저 정보(검사가 제대로 측정되었는지 확인하는 용도)",
          ]}
        />
        <p className="font-semibold text-slate-700">이용 목적</p>
        <Dots
          items={[
            "아이에게 맞는 검사 설정(문항 수, 속도 등)을 적용하고 결과서를 보여주기 위해서",
            "연령·학년군별 검사 결과를 분석해 검사를 개선하기 위해서",
          ]}
        />
        <p className="font-semibold text-slate-700">놀이(게임)를 이용할 때</p>
        <Dots
          items={[
            "이름이나 나이를 묻지 않고, 서버에 아무것도 저장하지 않습니다.",
            "게임에서 받은 별(진도)과 소리 설정만 이 기기의 브라우저에 저장됩니다.",
          ]}
        />
        <p>
          주소, 전화번호, 학교명, 생년월일, 사진, 목소리 등 그 밖의 정보는 받지 않습니다. 광고·마케팅 목적으로 쓰지
          않습니다.
        </p>
      </Section>

      <Section title="2. 보유 및 이용 기간">
        <Dots
          items={[
            <>
              검사 정보는 <strong className="text-slate-800">{retentionPeriod}</strong> 보관한 뒤 파기합니다.
            </>,
            "보호자가 동의를 철회하거나 삭제를 요청하면 지체 없이 파기합니다.",
            "이 기기의 브라우저에 저장된 정보는 이용자가 브라우저의 사이트 데이터를 지우면 사라집니다.",
          ]}
        />
      </Section>

      <Section title="3. 만 14세 미만 아동의 개인정보 (법정대리인 동의)">
        <Dots
          items={[
            "만 14세 미만 아동의 이름·나이·학년은 보호자(법정대리인)가 동의한 경우에만 받습니다. 검사 시작 전 동의 확인 화면에서 동의를 받습니다.",
            "동의하지 않으셔도 놀이(게임)와 알아보기·찾아보기는 이용할 수 있습니다. 다만 이름을 입력해야 하는 검사는 진행할 수 없습니다.",
            "보호자는 언제든지 아이의 정보를 열람·정정·삭제하거나 처리 정지를 요구하고, 동의를 철회할 수 있습니다. 아래 연락처로 요청해 주세요.",
          ]}
        />
      </Section>

      <Section title="4. 제3자 제공, 처리 위탁과 국외 보관">
        <Dots
          items={[
            "개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 따라 요구되는 경우는 예외입니다.",
            "데이터베이스 저장은 Supabase에, 웹사이트 제공은 Vercel에 맡겨 처리합니다. 이 업체들의 서버는 해외에 있을 수 있어, 정보가 국외에 보관될 수 있습니다.",
            "맡긴 업체는 이 사이트의 지시에 따라서만 정보를 처리합니다.",
          ]}
        />
      </Section>

      <Section title="5. 열람 권한과 안전하게 지키는 방법">
        <Dots
          items={[
            "이름이 포함된 검사 결과는 로그인한 관리자만 볼 수 있도록 접근 권한을 제한했습니다. 다른 이용자의 화면에는 보이지 않습니다.",
            "관리자 계정은 허가된 사람만 사용하고 비밀번호를 주기적으로 바꿉니다.",
            "인터넷 연결은 암호화(HTTPS)되어 있습니다.",
            "받는 정보를 이름·나이·학년으로 최소화했습니다.",
          ]}
        />
      </Section>

      <Section title="6. 브라우저 저장소 사용">
        <p>
          이 사이트는 쿠키로 이용자를 추적하지 않습니다. 대신 이 기기의 브라우저 저장소(localStorage)에 다음을
          저장합니다: 입력한 이름(다시 입력하지 않게), 가장 최근 검사 결과(내 결과·종합 결과서·임명장 표시용),
          놀이 별 기록, 소리 켜기/끄기 설정. 이 정보는 이 기기에만 있고 브라우저 데이터를 지우면 사라집니다.
        </p>
      </Section>

      <Section title="7. 파기 방법">
        <Dots
          items={[
            "보관 기간이 지났거나 삭제 요청을 받으면, 관리자가 데이터베이스에서 해당 검사 기록을 삭제합니다.",
            "삭제된 정보는 복구할 수 없습니다.",
          ]}
        />
      </Section>

      <Section title="8. 개인정보 문의 · 열람·삭제 요청">
        <Dots
          items={[
            <>운영자: {operatorName ? <strong className="text-slate-800">{operatorName}</strong> : MISSING}</>,
            <>문의 이메일: {contactEmail ? <strong className="text-slate-800">{contactEmail}</strong> : MISSING}</>,
            "요청하실 때는 아이의 이름, 검사한 날짜를 알려 주세요. 본인(보호자) 확인 후 처리합니다.",
          ]}
        />
      </Section>

      <Section title="9. 연구에 활용하는 경우">
        <p>
          검사 결과를 연구나 표준화 작업에 활용하려면, 소속 기관의 연구윤리심의위원회(IRB) 승인과 연구 목적에 맞는
          별도의 동의를 받은 뒤에만 사용합니다. 이 사이트는 아직 표준화된 규준이 없는 단계입니다.
        </p>
      </Section>

      <Section title="10. 검사 결과에 대한 안내">
        <p>
          이 사이트의 검사는 실행기능의 일부 특성을 살펴보기 위한 교육·연구용 수행과제이며, 의학적 또는
          심리학적 진단을 목적으로 하지 않습니다. 점수를 &ldquo;상위/평균/하위&rdquo;나 &ldquo;정상/위험&rdquo;처럼
          평가하지 않습니다.
        </p>
      </Section>

      <Section title="11. 이 방침의 변경">
        <p>
          내용이 바뀌면 이 페이지에 바뀐 날짜와 함께 알립니다. 수집 항목이나 목적이 크게 바뀌면 보호자 동의를 다시
          받습니다.
        </p>
      </Section>
    </div>
  );
}
