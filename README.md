# graduate-me-admin

graduate me의 관리자 웹을 관리하는 독립 저장소입니다. React, Vite, TypeScript, Tailwind CSS를 사용하며 기존 NestJS API에 연결합니다.

## 현재 제공 범위

초기 진입 화면, 독립 빌드, 개발·운영 Docker 이미지, API 프록시, 정적 검사와 CI를 제공합니다. 기존 사용자 웹의 `/admin` 공유 관리 화면은 아직 이전하지 않았습니다. 로그인·권한 확인과 분석·사용량·오류 신고 화면도 이 저장소에 아직 구현하지 않았습니다.

## 저장소 배치

```text
codding/
├── graduate-me-admin/
├── graduate-me-frontend/
├── graduate-me-backend/
└── graduate-me-infra/
```

각 앱은 자신의 소스·의존성만으로 설치·빌드합니다. 타입·API 계약도 각 앱에서 소유하며 다른 앱을 직접 import하지 않습니다. 교수·조교의 수업 화면은 사용자 웹, 시스템 운영 화면은 관리자 웹에 배치하는 방향입니다.

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

`pnpm check`는 Prettier 적용, ESLint, 타입 검사를 순서대로 실행합니다. `check:ci`는 파일을 수정하지 않습니다. Vitest는 준비되어 있으나 초기 화면에 대한 테스트는 아직 없습니다. 테스트 파일이 없는 초기 단계만 통과하도록 설정했으며 테스트가 추가되면 실패를 정상적으로 보고합니다.

`pnpm build`는 정적 파일을 `dist/`에 생성합니다. 운영 구성은 Nginx로 정적 파일과 SPA 경로를 제공하고 `/api/`를 백엔드로 전달합니다. `/healthz`는 웹 컨테이너 상태만 확인하며 백엔드 연결·인증 성공을 보장하지 않습니다.

```sh
docker compose up --build --wait
docker compose down
```

개발 구성과 운영 구성을 같은 3001 포트로 동시에 실행하지 않습니다. 통합 인프라의 전체 실행·홈서버 배포 등록은 별도 작업입니다.

## 인증 연결 시 확인할 점

현재 백엔드는 단일 `AUTH_URL`로 OAuth 콜백을 만들고 인증된 변경 요청의 `Origin`을 검사합니다. 따라서 관리자 앱을 3001 포트나 별도 도메인에 띄우는 것만으로 기존 로그인이 모두 연결되지는 않습니다. 로그인 반환 위치·쿠키·허용 출처를 관리자 주소에 맞게 설계하고 실제 환경에서 확인해야 합니다. 프록시에서 `Origin`을 바꾸거나 서버의 출처 검사를 제거하는 방식으로 연결하지 않습니다.

관리자 API의 기존 권한 검사는 백엔드에 유지합니다. 브라우저에 비밀 키를 넣지 않습니다.

코드 배치는 [Architecture.md](Architecture.md), 작업 지침은 [AGENTS.md](AGENTS.md)를 따릅니다.
