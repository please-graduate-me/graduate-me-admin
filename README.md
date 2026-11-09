# graduate-me-admin

graduate me의 관리자 웹을 관리하는 독립 저장소입니다. React, Vite, TypeScript, TanStack Router, TanStack Query, Ant Design을 사용하며 기존 NestJS API에 연결합니다.

## 프로젝트 문서

기획·구현 현황·검증 결과·미완료 항목은 [노션 구현 현황](https://app.notion.com/p/4133b4cce74081479866c86e64b5e7d1)에서 관리합니다.

## 저장소 배치

```text
codding/
├── graduate-me-admin/
├── graduate-me-frontend/
├── graduate-me-backend/
└── graduate-me-infra/
```

각 앱은 자신의 소스·의존성만으로 설치·빌드합니다. 타입·API 계약도 각 앱에서 소유하며 다른 앱을 직접 import하지 않습니다. 학과 답변 도우미와 운영 관리자는 이 admin 앱에서 진입하고, 질문자는 사용자 웹의 학습 UI를 사용합니다.

## 로컬 개발

Node.js 22.12 이상, pnpm 10.33.0, Docker Compose가 필요합니다. 백엔드가 만든 `graduate-me-app` 네트워크에 연결합니다.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

관리자 웹은 http://localhost:3001 입니다. 기존 사용자 웹의 3000 포트와 겹치지 않습니다. 소스 변경은 Compose Watch가 반영합니다. `dev:app`은 컨테이너 내부 실행 명령입니다.

기본 API 주소는 `http://api:4000`입니다. 환경변수 변경이 필요하면 `.env.example`을 `.env`로 복사해 설정합니다. Compose가 환경변수를 주입하며 브라우저에 백엔드 내부 주소를 전달하지 않습니다. 통합 인프라의 네트워크를 사용할 때는 실제 네트워크 이름을 `APP_NETWORK_NAME`으로 지정합니다.

```sh
pnpm dev:logs
pnpm dev:down
```

## 검사와 빌드

```sh
pnpm check
pnpm check:ci
pnpm test
pnpm build
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
```

`pnpm check`는 Prettier 적용, ESLint, 타입 검사를 순서대로 실행합니다. `check:ci`는 포맷을 수정하지 않고 검사하며 라우트 트리는 갱신합니다. Vitest는 모의 fetch 응답으로 운영자 진입, 미로그인·도우미의 운영 경로 차단, 검색 조건 복원, QueryClient 전달과 없는 경로를 확인합니다. Playwright나 실제 AI 모델을 사용하지 않습니다. 타입 검사·테스트 전에 `pnpm routes:generate`로 라우트 트리를 생성하므로 새 체크아웃에서도 바로 실행할 수 있습니다.

`pnpm build`는 정적 파일을 `dist/`에 생성합니다. 운영 구성은 Nginx로 정적 파일과 SPA 경로를 제공하고 `/api/`를 백엔드로 전달합니다. `/healthz`는 웹 컨테이너 상태만 확인하며 백엔드 연결·인증 성공을 보장하지 않습니다.

```sh
docker compose up --build --wait
docker compose down
```

개발 구성과 운영 구성을 같은 3001 포트로 동시에 실행하지 않습니다. 통합 인프라의 전체 실행·홈서버 배포 등록은 별도 작업입니다.

## 인증과 역할

연결할 백엔드에 학습 작업 공간 마이그레이션과 API가 적용되어 있어야 합니다. 백엔드의 `ADMIN_URL`은 이 앱의 공개 주소(로컬 기본값 `http://localhost:3001`)로 설정합니다. 백엔드는 이 주소의 로그인 반환 위치와 변경 요청 `Origin`을 검사합니다. 프록시에서 출처를 바꾸거나 검사를 제거하지 않습니다.

운영자는 백엔드의 `ADMIN_EMAILS`로 지정합니다. 운영자가 도우미 메뉴에서 기존 Google 로그인 계정에 담당 언어·자료·검토·수정 요청 권한을 저장하면 해당 계정은 `/questions`로 진입합니다. 언어·자료가 일치하면서 본인에게 배정된 질문만 접근하며, 빈 자료 목록은 접근 권한이 없다는 뜻입니다. 운영 관리 API의 권한 검사는 서버가 담당합니다.

- `/login`: Google 로그인과 접근 권한 안내
- `/questions`, `/questions/:id`: 배정 질문·답변·초안·내부 메모
- `/events`: 내부 검토·변경 이력
- `/`: 운영 현황
- `/materials`, `/reviews`, `/helpers`, `/usage`, `/shares`: 운영자 전용 관리

질문은 서버에서 검색하고 20개씩 페이지를 조회합니다. 상태·기간은 현재 질문 페이지 안에서 필터합니다. 운영 자료는 PDF·영상별 최근 100개, 사용 이력은 최근 100개 작업을 조회하며 표시 범위를 화면에 명시합니다. 서버가 전체 집계를 제공하는 운영 현황과 조회 목록의 집계를 구분합니다.

브라우저에는 인증 비밀값을 넣지 않습니다. 별도 공개 도메인으로 배포할 때는 OAuth 콜백 주소와 쿠키 설정도 해당 배포 환경에 맞게 확인합니다.

코드 배치는 [Architecture.md](Architecture.md), 작업 지침은 [AGENTS.md](AGENTS.md)를 따릅니다.

## 앱 코드 배치

- `src/app/routes/`: 파일 기반 라우트와 화면 조립. `-components/`는 해당 라우트와 하위 라우트의 부품·훅을 배치하며 경로 생성에서 제외합니다.
- `src/app/routes/_dashboard/route.tsx`: 대시보드 공통 레이아웃. `_dashboard`는 URL에 포함되지 않습니다.
- `src/app/queryClient.ts`, `router.ts`: 서버 상태 캐시와 라우터 연결.
- `src/app/theme.ts`: Ant Design 공통 테마. 기본 UI는 `antd`에서 직접 가져오며, Tailwind는 화면 배치에 사용합니다.
- `tsr.config.json`: 개발 플러그인과 생성 명령이 공유하는 라우트 설정. 테스트·스토리 파일도 라우트에서 제외합니다.

`src/app/routeTree.gen.ts`는 생성기가 관리하며 직접 수정하거나 포맷하지 않습니다. `domains/`는 인증·질문·운영·공유 API 계약과 요청을 각각 소유합니다. 기본 UI는 Ant Design을 직접 사용하므로 자체 기본 컴포넌트 래퍼를 만들지 않습니다.
