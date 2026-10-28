import type { MetadataRoute } from "next";

// 휴대폰/PC의 "홈 화면에 추가"(앱 설치)에 쓰이는 정보입니다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "실행기능 놀이터",
    short_name: "실행기능 놀이터",
    description: "유초등을 위한 실행기능 정보·검사·놀이 사이트",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
