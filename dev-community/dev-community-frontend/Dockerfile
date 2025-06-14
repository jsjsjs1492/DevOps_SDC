#Dockerfile for React App with Nginx
# ----------- 1단계: React 앱 빌드(Stage 1) -----------
FROM node:20 as builder
WORKDIR /app
COPY . .
RUN cp .env.production .env
RUN npm install --legacy-peer-deps && npm run build

# ----------- 2단계: Nginx로 정적 파일 서빙(Stage 2) -----------
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
