# ===== 1단계: 빌드 환경 (Gradle을 사용해 JAR 생성) =====
FROM gradle:7.6.2-jdk17 AS builder
# 작업 디렉토리 설정
WORKDIR /app

# 빌드에 필요한 파일 복사 (의존성 캐시 최적화)
COPY gradle ./gradle
COPY gradlew .
COPY settings.gradle .
COPY build.gradle .
COPY src ./src

# Gradle 빌드 실행 (테스트 제외)
RUN chmod +x ./gradlew && \
    ./gradlew clean build -x test

# ===== 2단계: 실행 환경 (최소한의 JRE 기반 이미지) =====
FROM eclipse-temurin:17-jdk-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 배포 디렉토리 생성 (Jenkinsfile과 유사한 구조)
RUN mkdir -p /var/deploy
# 1단계에서 빌드된 JAR 파일 복사
COPY --from=builder /app/build/libs/*.jar /var/deploy/dev-community-backend.jar

# 포트 노출 (젠킨스와 충돌 방지를 위해 8081로 변경)
EXPOSE 8081

# 애플리케이션 실행 (8081 포트 사용)
CMD ["java", "-Dserver.port=8081", "-jar", "/var/deploy/dev-community-backend.jar"]
