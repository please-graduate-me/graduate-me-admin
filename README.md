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

개발 구성과 운영 구성을 같은 3001 포트로 동시에 실행하지 않습니다. 통합 인프라의 전체 실행과 홈서버 배포는 `../graduate-me-infra`의 배포 안내를 따릅니다.

## 인증과 역할

운영 콘솔은 관리자 아이디와 비밀번호만 사용합니다. 일반 사용자, 조교, 수업 담당자는 `graduate-me-frontend`를 사용합니다. 조교는 개인 답변 작업자가 아니라 커뮤니티에서 타이틀을 가진 일반 사용자입니다.

백엔드의 `ADMIN_LOGIN_ID`, `ADMIN_PASSWORD_HASH`, `ADMIN_URL`을 설정합니다. 해시는 백엔드의 `pnpm admin:password`로 생성하며, 실제 비밀번호와 해시는 브라우저 환경변수나 Git에 넣지 않습니다. 설정·세션 만료·로그인 시도 제한은 백엔드 README의 인증 안내를 따릅니다. Google OAuth 설정은 사용자 웹에만 필요합니다.

- `/login`: 운영 아이디·비밀번호 인증
- `/`: 운영 현황
- `/helpers`: 사용자 계정의 조교 타이틀 부여·회수
- `/materials`, `/usage`, `/shares`, `/moderation`: 자료·사용량·공유·게시글 신고 관리
- `/questions`, `/reviews`, `/events`: 기존 비공개 질문·자료 오류 신고·검토 이력
- 기존 `/courses` 주소: 사용자 웹으로 이동 안내

조교 자격은 운영 콘솔 접근이나 자료 수정 권한을 부여하지 않습니다. 게시글과 댓글의 조교 배지, 본인이 태그된 글 모아보기는 사용자 웹에서 제공합니다. 자료 등록·OCR은 `/api/admin/resources`의 전용 인증 경로를 사용하면서 기존 소유권·자료·AI 한도를 적용합니다.

독립 관리자 호스트는 `ADMIN_BASE_PATH=/`, `VITE_STUDENT_URL=https://pleasegraduate.me`로 빌드합니다. `/api/`는 같은 출처의 백엔드로 프록시하며, 서버가 운영 세션과 변경 요청 출처를 검증합니다.
