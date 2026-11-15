# Node.js 22 환경에서 정적 웹 파일을 만드는 빌드 단계를 시작한다.
FROM node:22-bookworm-slim AS build
# 저장소에서 정한 pnpm 버전을 사용한다.
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
# 이후 빌드 명령을 실행할 디렉터리를 정한다.
WORKDIR /app
# 코드 변경 시 의존성 설치 결과를 재사용하도록 목록부터 복사한다.
COPY package.json pnpm-lock.yaml ./
# 잠금 파일에 기록된 버전 그대로 의존성을 설치한다.
RUN pnpm install --frozen-lockfile
# .dockerignore에서 제외한 비밀 파일과 로컬 산출물을 빼고 코드를 복사한다.
COPY . .
# 관리자 웹이 제공될 기본 경로를 빌드 인자로 받는다.
ARG ADMIN_BASE_PATH=/
# 사용자 웹으로 이동할 공개 주소를 빌드 인자로 받으며 비밀값은 넣지 않는다.
ARG VITE_STUDENT_URL=
# Vite가 관리자 웹의 기본 경로를 읽게 한다.
ENV ADMIN_BASE_PATH=${ADMIN_BASE_PATH}
# Vite가 사용자 웹의 공개 주소를 읽게 한다.
ENV VITE_STUDENT_URL=${VITE_STUDENT_URL}
# 타입 검사 후 브라우저에 제공할 정적 웹 파일을 만든다.
RUN pnpm build

# 실행 이미지에는 빌드 도구 대신 정적 웹 서버만 포함한다.
FROM nginx:stable-alpine AS runtime
# 컨테이너 시작 시 API 주소를 채울 Nginx 설정 양식을 복사한다.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
# 앞선 빌드 단계에서 만든 정적 파일만 실행 이미지에 복사한다.
COPY --from=build /app/dist /usr/share/nginx/html
# API 프록시의 기본 주소이며 운영 Compose에서 운영 API 주소로 덮어쓴다.
ENV API_INTERNAL_URL=http://api:4000
# Nginx의 내부 포트를 표시하며 기본 실행 명령은 기반 이미지에서 상속한다.
EXPOSE 3001
