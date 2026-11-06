import { redirect } from "next/navigation";

// 예전 주소(/training/earth-guard)로 들어온 사람도 새 위치로 안내합니다.
export default function EarthGuardRedirect() {
  redirect("/training/play/earth");
}
