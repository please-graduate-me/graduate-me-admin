FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG ADMIN_BASE_PATH=/
ARG VITE_STUDENT_URL=
ENV ADMIN_BASE_PATH=${ADMIN_BASE_PATH}
ENV VITE_STUDENT_URL=${VITE_STUDENT_URL}
RUN pnpm build

FROM nginx:stable-alpine AS runtime
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_INTERNAL_URL=http://api:4000
EXPOSE 3001
