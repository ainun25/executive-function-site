"use client";

import { useEffect, useState } from "react";
import { fetchTestConfig, TEST_CONFIG_DEFAULTS } from "./testConfig";
import type { EFDomain } from "@/types";

/**
 * 검사 페이지에서 현재 적용 중인 설정(관리자가 바꾼 값 또는 기본값)을 불러옵니다.
 * 검사 컴포넌트는 처음 화면에 나타날 때 설정을 한 번만 읽기 때문에,
 * isReady가 true가 된 뒤에만 검사 화면을 보여줘야 설정이 정확히 적용됩니다.
 */
export function useTestConfig<T extends object>(domain: EFDomain): { config: T; isReady: boolean } {
  const [config, setConfig] = useState<T>(TEST_CONFIG_DEFAULTS[domain] as unknown as T);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    fetchTestConfig(domain).then((loaded) => {
      if (isCancelled) return;
      setConfig(loaded as unknown as T);
      setIsReady(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [domain]);

  return { config, isReady };
}
