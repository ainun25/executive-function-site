import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        <p className="font-medium text-slate-600">실행기능 놀이터</p>
        <p className="mt-1">
          본 사이트의 검사는 실행기능의 일부 특성을 살펴보기 위한 교육·연구용 수행과제이며,
          의학적 또는 심리학적 진단을 목적으로 하지 않습니다.
        </p>
        <p className="mt-3">© {new Date().getFullYear()} 실행기능 놀이터. 교육 및 연구 목적의 프로토타입입니다.</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/privacy" className="inline-block text-indigo-600 hover:underline">
            개인정보 보호 안내
          </Link>
          <Link href="/share" className="inline-block text-indigo-600 hover:underline">
            앱처럼 쓰기 · QR 안내
          </Link>
        </div>
      </div>
    </footer>
  );
}
