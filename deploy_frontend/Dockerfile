# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 폰트 파일 권한 수정 (nginx가 읽을 수 있도록)
RUN chmod 644 /usr/share/nginx/html/fonts/*.ttf 2>/dev/null || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
