# 실행기능 놀이터 (초등학생 실행기능 정보·검사·훈련 통합 사이트)

## 1. 이 프로젝트는 무엇인가요?

초등학생의 실행기능(Executive Function)을 이해하고, 관련 자료를 찾아보고, 간단한 수행과제를
해보고, 훈련 활동을 이용할 수 있는 웹사이트입니다.

핵심 기능 4가지:

1. 실행기능 이해 (`/about`)
2. 실행기능 자료 검색 (추후 PHASE에서 구현)
3. 실행기능 검사 (`/tests`, 검사 엔진은 추후 PHASE에서 구현)
4. 실행기능 훈련 (`/training`)

> ⚠️ 본 사이트의 검사는 교육·연구용 수행과제이며 의학적·심리학적 진단 도구가 아닙니다.

현재는 **PHASE 1 (기본 뼈대)** 단계까지 완성되어 있습니다. 검사 기능, 검색 기능, 관리자 기능,
데이터베이스 연동은 아직 만들지 않았습니다.

## 2. 어떤 기술을 사용했나요?

- **Next.js 16 (App Router)** — 페이지와 라우팅을 담당하는 프레임워크
- **React 19 + TypeScript** — 화면(UI)을 만드는 라이브러리와 타입 안정성
- **Tailwind CSS v4** — 디자인/스타일을 빠르게 입히는 CSS 도구
- (향후 추가 예정) **Supabase** — 데이터베이스와 로그인 기능
- (향후 추가 예정) **Recharts** — 검사 결과 그래프
- (향후 추가 예정) **Vercel** — 배포

## 3. 실행 방법

### 처음 한 번만 하면 되는 작업 (패키지 설치)

```bash
npm install
```

### 개발 서버 실행 방법

```bash
npm run dev
```

터미널에 나오는 주소(보통 http://localhost:3000 )를 브라우저에 입력하면 됩니다.
코드를 수정하면 화면이 자동으로 새로고침됩니다.

### 오류 확인용 빌드 (실제 배포 전 점검)

```bash
npm run build
```

이 명령이 오류 없이 끝나면, 배포해도 안전하다는 뜻입니다.

## 4. 폴더 구조

```
src/
  app/                # 실제 화면(페이지)들이 위치하는 곳
    page.tsx          # 메인 페이지 (/)
    about/page.tsx     # 실행기능 알아보기 (/about)
    tests/page.tsx      # 실행기능 검사 메뉴 (/tests)
    training/page.tsx    # 실행기능 훈련 (/training)
    layout.tsx          # 모든 페이지에 공통으로 적용되는 뼈대 (헤더/푸터 포함)
    globals.css         # 전체 스타일
  components/
    layout/
      Header.tsx        # 상단 메뉴 (PC/모바일 반응형)
      Footer.tsx         # 하단 정보
  data/                 # 화면에 보여줄 예시/기본 데이터
    efDomains.ts         # 실행기능 3영역 설명, 검사 카드 정보
    trainingMaterials.ts # 훈련자료 예시 데이터
  types/
    index.ts             # 프로젝트 전체에서 사용하는 타입(데이터 구조) 정의
```

앞으로 검사 엔진이 추가되면 다음과 같은 폴더가 생길 예정입니다 (아직 없음):

```
src/
  components/tasks/
    inhibition/         # 억제통제(Go/No-Go) 검사 컴포넌트
    working-memory/      # 작업기억 검사 컴포넌트
    flexibility/          # 인지적 유연성 검사 컴포넌트
  lib/                  # 반응시간 측정 등 검사 공통 로직
  admin/                # 관리자 페이지
```

## 5. 검사별 기능 (현재 상태)

억제통제(Go/No-Go), 작업기억(순서 기억), 인지적 유연성(규칙 전환) 3개 검사 모두 실제로
동작합니다. `/tests`에서 카드를 눌러 소개 → 연습 → 본검사 → 결과 순서로 진행할 수 있습니다.
결과는 이 브라우저(localStorage)와 Supabase 데이터베이스에 함께 저장됩니다.

## 6. Supabase 연결 방법 (연결 완료)

이 프로젝트는 Supabase에 연결되어 있습니다. 다른 컴퓨터에서 이어서 개발하거나, 새로운
Supabase 프로젝트로 바꾸고 싶을 때는 아래 순서를 따르세요.

1. https://supabase.com 에서 프로젝트 생성 (또는 기존 프로젝트 사용)
2. 프로젝트의 `Project URL`과 `anon public key`(또는 새 이름인 `publishable key`) 확인
   - Supabase 대시보드 → 프로젝트 선택 → **Project Settings → Data API**
3. 프로젝트 루트의 `.env.local` 파일에 아래 형식으로 입력 (이 파일은 git에 올라가지 않습니다)

```
NEXT_PUBLIC_SUPABASE_URL=여기에_프로젝트_URL_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_또는_publishable_key_입력
```

4. `@supabase/supabase-js` 패키지는 이미 설치되어 있습니다.
5. **데이터베이스 테이블 만들기**: [supabase/schema.sql](supabase/schema.sql) 파일 내용을
   Supabase 대시보드의 **SQL Editor**에 붙여넣고 실행하면 `test_sessions`(검사 세션)와
   `trials`(문항별 원자료) 테이블이 만들어집니다. 이 SQL은 여러 번 실행해도 안전합니다.
6. 개발 서버를 재시작하면(`.env.local` 변경 후 필수) 검사 결과가 자동으로 Supabase에도
   저장됩니다. 저장 로직은 [src/lib/resultStorage.ts](src/lib/resultStorage.ts)에 있습니다.

> ⚠️ 지금 설정된 데이터베이스 접근 정책(RLS)은 로그인 기능이 없는 프로토타입 단계에 맞춰
> "누구나 결과를 쓰고 읽을 수 있음"으로 되어 있습니다. 실제 서비스로 전환할 때는 PHASE 8의
> 인증 구조에 맞춰 `supabase/schema.sql`의 정책을 다시 설계해야 합니다.

## 7. 환경변수 설정 방법

- 환경변수 파일 이름은 `.env.local` 이어야 하며, 이 파일은 git에 올리면 안 됩니다 (`.gitignore`에
  이미 등록되어 있습니다).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 두 값이 필요합니다.
- 이 값이 없어도 사이트는 정상 작동합니다 (Supabase 저장만 건너뛰고, localStorage 데모
  모드로 자동 동작합니다).

## 8. Vercel 배포 방법

1. 이 프로젝트를 GitHub 저장소에 올립니다 (git init → commit → GitHub에 push).
2. https://vercel.com 에서 GitHub 계정으로 로그인 후 "New Project"로 이 저장소를 선택합니다.
3. 프레임워크가 Next.js로 자동 인식됩니다.
4. **"Environment Variables"**에 `.env.local`과 똑같은 값을 등록합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. "Deploy" 버튼을 누르면 몇 분 안에 실제 주소(예: `https://your-project.vercel.app`)가 생깁니다.
6. 이후 GitHub 저장소에 새 커밋을 올릴 때마다 자동으로 재배포됩니다.

## 9. 오류가 생겼을 때 확인할 것

1. `npm run build` 를 실행해서 어떤 파일, 몇 번째 줄에서 오류가 나는지 확인합니다.
2. 터미널에 나오는 오류 메시지의 파일 경로(`src/app/...`)를 먼저 열어봅니다.
3. `npm install`을 다시 실행해서 패키지 설치가 꼬이지 않았는지 확인합니다.
4. `.next` 폴더를 지우고 (`rm -rf .next` 또는 Windows에서 폴더 삭제) 다시 `npm run dev`를
   실행해봅니다. (캐시 문제인 경우가 많습니다.)

## 10. 개인정보 및 연구윤리 관련 안내 (중요)

- 이 프로젝트는 초등학생을 대상으로 하므로 개인정보를 최소한으로만 수집하도록 설계되었습니다.
  실명은 수집하지 않고, 브라우저가 자동으로 만든 익명 participantId만 사용합니다. 학년/연령대는
  아직 수집하지 않으며, 필요할 때 컬럼을 추가하는 방식으로 확장할 수 있게 설계했습니다.
- 사용자에게 보여지는 안내는 [/privacy](http://localhost:3000/privacy) 페이지(하단 푸터에서
  "개인정보 보호 안내" 링크로 이동 가능)에 정리되어 있습니다.
- 이후 실제 아동을 대상으로 한 연구나 서비스에 사용하려면 반드시 보호자 동의 절차, 공식
  개인정보처리방침, 기관 연구윤리심의(IRB) 검토가 추가로 필요합니다. 이 코드 자체는 그런 절차를
  대신하지 않습니다.

## 11. 검사 원자료(raw data) 및 CSV 다운로드

관리자로 로그인한 뒤 `/admin` → **"검사 원자료 조회"** 탭에서:
- 검사 종류별로 필터링해서 문항 단위 원자료를 표로 볼 수 있습니다.
- **CSV 다운로드** 버튼으로 전체 데이터를 내려받을 수 있습니다 (엑셀에서 한글이 깨지지 않도록
  처리되어 있습니다).
- CSV 컬럼: `participantId, age, grade, task, trial, condition, stimulus, answer, correct,
  reactionTime, errorType, date` — age/grade는 아직 수집하지 않아 빈 값으로 나옵니다.
