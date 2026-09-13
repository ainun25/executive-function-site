"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAdminSession } from "@/lib/useAdminSession";

const navItems = [
  { href: "/about", label: "실행기능 알아보기" },
  { href: "/search", label: "실행기능 찾아보기" },
  { href: "/tests", label: "실행기능 검사" },
  { href: "/training", label: "실행기능 훈련" },
  { href: "/results", label: "내 결과" },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn } = useAdminSession();

  // 관리자 메뉴는 로그인한 사람에게만 보입니다 (섹션 3).
  const visibleNavItems = isLoggedIn
    ? [...navItems, { href: "/admin", label: "관리자" }]
    : navItems;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-slate-800"
          onClick={() => setIsMenuOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
            EF
          </span>
          <span className="hidden sm:inline">실행기능 놀이터</span>
        </Link>

        {/* PC용 메뉴 */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-teal-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-base font-medium ${
                  isActive ? "bg-teal-500 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
