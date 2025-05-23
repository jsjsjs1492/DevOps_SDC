# ----------- 1단계: React 앱 빌드(Stage 1) -----------
FROM node:20 as builder
WORKDIR /app
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm install && npm run build

# ----------- 2단계: Nginx로 정적 파일 서빙(Stage 2) -----------
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
