"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Chrome/Edge가 "설치할 수 있어요"를 알려줄 때 쓰는 이벤트 (타입이 표준에 없어서 직접 정의)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * 앱처럼 설치하기 + QR코드·공유 안내 페이지입니다.
 *  1) 홈 화면에 추가(PWA): 안드로이드/아이폰 방법과, 가능한 브라우저에서는 설치 버튼
 *  2) QR코드: 학교/기관에 나눠줄 안내문을 인쇄할 수 있어요.
 */
export default function SharePage() {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(origin);
    QRCode.toDataURL(origin, { width: 600, margin: 1, color: { dark: "#1e1b4b", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setNotice(choice.outcome === "accepted" ? "설치했어요! 홈 화면에서 찾아보세요." : "설치를 취소했어요.");
    setInstallEvent(null);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("주소를 복사했어요.");
    } catch {
      setNotice("복사하지 못했어요. 주소를 길게 눌러 복사해 주세요.");
    }
  };

  const shareLink = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "실행기능 놀이터", text: "유초등 실행기능 놀이터에 놀러 오세요!", url });
      } catch {
        // 공유 창을 닫은 경우는 무시합니다.
      }
    } else {
      void copyLink();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <header className="text-center print:hidden">
        <h1 className="text-3xl font-extrabold text-slate-900">앱처럼 쓰기 · 공유하기</h1>
        <p className="mt-3 text-sm text-slate-500">
          스토어에서 내려받지 않아도, 휴대폰 홈 화면에 아이콘을 만들어 앱처럼 쓸 수 있어요. 비용은 없어요.
        </p>
      </header>

      {notice && <p className="rounded-xl bg-indigo-50 p-3 text-center text-sm text-indigo-800 print:hidden">{notice}</p>}

      {/* 1. 홈 화면에 추가 */}
      <section className="space-y-4 rounded-2xl border border-slate-200 p-6 print:hidden">
        <h2 className="text-lg font-bold text-slate-900">1. 홈 화면에 추가하기</h2>
        {installEvent && (
          <button
            type="button"
            onClick={install}
            className="w-full rounded-full bg-indigo-500 px-6 py-4 text-lg font-bold text-white hover:bg-indigo-600"
          >
            📲 앱으로 설치하기
          </button>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold text-slate-800">안드로이드 (크롬)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
              <li>크롬에서 이 사이트를 열어요.</li>
              <li>오른쪽 위 점 세 개(⋮) 메뉴를 눌러요.</li>
              <li>&quot;홈 화면에 추가&quot; 또는 &quot;앱 설치&quot;를 눌러요.</li>
            </ol>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="font-bold text-slate-800">아이폰 · 아이패드 (사파리)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
              <li>사파리에서 이 사이트를 열어요. (다른 앱 속 브라우저는 안 돼요)</li>
              <li>아래쪽 공유 버튼(네모에서 화살표가 나온 모양)을 눌러요.</li>
              <li>&quot;홈 화면에 추가&quot;를 누르고 &quot;추가&quot;를 눌러요.</li>
            </ol>
          </div>
        </div>
        <p className="text-xs text-slate-400">PC의 크롬·엣지에서는 주소창 오른쪽의 설치 아이콘으로도 설치할 수 있어요.</p>
      </section>

      {/* 2. QR코드와 안내문 */}
      <section className="space-y-4 rounded-2xl border border-slate-200 p-6 print:border-0 print:p-0">
        <h2 className="text-lg font-bold text-slate-900 print:hidden">2. QR코드와 안내문</h2>

        <div className="rounded-3xl border-4 border-indigo-200 bg-white p-8 text-center print:border-indigo-400">
          <p className="text-sm font-semibold text-indigo-600">유초등 실행기능 놀이터</p>
          <h3 className="mt-1 text-2xl font-extrabold text-slate-900">QR코드를 찍어 놀러 오세요!</h3>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="사이트 QR코드" className="mx-auto my-5 h-64 w-64 print:h-80 print:w-80" />
          ) : (
            <div className="mx-auto my-5 flex h-64 w-64 items-center justify-center text-sm text-slate-400">QR코드를 만드는 중...</div>
          )}
          <p className="break-all text-lg font-bold text-slate-800">{url}</p>
          <ul className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm leading-relaxed text-slate-600">
            <li className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>실행기능을 알아보고, 놀이 게임으로 연습할 수 있어요.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>휴대폰 카메라로 QR코드를 비추면 바로 열려요. 설치는 필요 없어요.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>검사 결과는 진단이 아니라 참고 자료예요.</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-600"
          >
            🖨️ 안내문 인쇄 / PDF 저장
          </button>
          <button
            type="button"
            onClick={shareLink}
            className="flex-1 rounded-full border border-indigo-300 px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            📤 링크 공유하기
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            🔗 주소 복사
          </button>
        </div>
      </section>
    </div>
  );
}
