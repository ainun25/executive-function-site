"use client";

interface ConfirmBarProps {
  message: string;
  confirmLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// 브라우저가 window.confirm 팝업을 막는 경우에도 동작하도록,
// 팝업 대신 화면 안에 "정말 할까요?" 확인 영역을 보여줍니다.
export default function ConfirmBar({
  message,
  confirmLabel = "삭제",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmBarProps) {
  return (
    <div
      role="alertdialog"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-300 bg-indigo-50 p-4 text-sm text-indigo-900"
    >
      <p className="whitespace-pre-line">{message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isBusy}
          className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isBusy ? "처리 중..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </div>
  );
}
