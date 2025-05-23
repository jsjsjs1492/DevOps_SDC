pipeline {
    agent any

    environment {
        // 백엔드 관련 환경 변수
        BACKEND_IMAGE = 'dev-community-backend'
        BACKEND_SERVER = "ubuntu@52.78.59.185"  // 백엔드 서버 주소
        BACKEND_PORT = "8081"  // 젠킨스와 충돌 방지를 위해 8081 포트 사용
        BACKEND_URL = "http://52.78.59.185"  // 백엔드 URL
        BACKEND_API_URL = "${BACKEND_URL}:${BACKEND_PORT}"
        
        // 프론트엔드 관련 환경 변수
        FRONTEND_IMAGE = 'dev-community-frontend'
        FRONTEND_SERVER = "ubuntu@13.124.40.201"  // 프론트엔드 서버 주소
        FRONTEND_URL = "http://13.124.40.201"  // 프론트엔드 URL
        FRONTEND_TEST_PORT = '3000'  // 테스트용 포트
        FRONTEND_PROD_PORT = '80'    // 프로덕션용 포트
        
        // Docker 관련 환경 변수
        DOCKER_REGISTRY = 'jangker'  // Docker Hub 사용자명
    }

    triggers {
        // GitHub Webhook으로 푸시 감지
        githubPush()
    }

    stages {
        stage('Pull from GitHub') {
            steps {
                echo "📥 Pulling latest code from GitHub..."
                git branch: 'develop', url: 'https://github.com/jsjsjs1492/deploy_test.git'
            }
        }

        // 백엔드 Docker 이미지 빌드 및 푸시
        stage('Build & Push Backend Docker Image') {
            steps {
                echo "🛠️ Building backend Docker image..."
                dir('dev-community/dev-community-backend') {
                    script {
                        docker.withRegistry('', 'dockerhub-credentials') {
                            def backendImage = docker.build("${DOCKER_REGISTRY}/${BACKEND_IMAGE}:${env.BUILD_NUMBER}", "-f Dockerfile_backend .")
                            backendImage.push('latest')
                        }
                    }
                }
            }
        }

        // 백엔드 배포
        stage('Deploy Backend') {
            steps {
                echo "🚀 Deploying backend to remote server..."
                sh """
                ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
                    docker pull ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest
                    docker stop backend-app || true
                    docker rm backend-app || true
                    docker run -d -p ${BACKEND_PORT}:8081 --name backend-app ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest
                    echo "백엔드 서비스 시작됨"
                '
                """
                
                echo "⏳ Waiting for backend to start..."
                sh "sleep 30"  // 백엔드가 완전히 시작될 때까지 대기
            }
        }

        // 프론트엔드 Docker 이미지 빌드 및 푸시
        stage('Build & Push Frontend Docker Image') {
            steps {
                echo "🛠️ Building frontend Docker image..."
                dir('dev-community/dev-community-frontend') {
                    // Nginx 설정 디렉토리 생성 (없을 경우)
                    sh 'mkdir -p nginx'
                    
                    // Nginx 설정 파일 생성 - API 프록시 추가
                    sh """
                    echo 'server {
                        listen 80;
                        
                        location / {
                            root /usr/share/nginx/html;
                            index index.html index.htm;
                            try_files \$uri \$uri/ /index.html;
                        }
                        
                        # API 요청을 백엔드로 프록시
                        location /api {
                            proxy_pass ${BACKEND_API_URL};
                            proxy_http_version 1.1;
                            proxy_set_header Upgrade \$http_upgrade;
                            proxy_set_header Connection "upgrade";
                            proxy_set_header Host \$host;
                            proxy_cache_bypass \$http_upgrade;
                        }
                    }' > nginx/default.conf
                    """
                    
                    script {
                        docker.withRegistry('', 'dockerhub-credentials') {
                            // 백엔드 API URL을 빌드 인자로 전달
                            def frontendImage = docker.build("${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:${env.BUILD_NUMBER}", 
                                "--build-arg REACT_APP_API_URL=${BACKEND_API_URL} -f Dockerfile_frontend .")
                            frontendImage.push('latest')
                        }
                    }
                }
            }
        }

        // 테스트 환경에 프론트엔드 배포
        stage('Deploy Frontend to Test') {
            steps {
                echo "🧪 Deploying frontend to test environment..."
                sh """
                ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
                    docker pull ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest
                    docker stop react-app-test || true
                    docker rm react-app-test || true
                    docker run -d -p ${FRONTEND_TEST_PORT}:80 --name react-app-test ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest
                '
                """
                
                echo "⏳ Waiting for test environment to be ready..."
                sh "sleep 10"
            }
        }

        // Cypress E2E 테스트 실행
        stage('Run E2E Tests') {
            steps {
                echo "🧪 Running Cypress E2E tests..."
                dir('dev-community/dev-community-frontend') {
                    // Cypress 테스트 파일 수정 - 하드코딩된 URL 제거
                    sh """
                    find cypress/e2e -name "*.cy.js" -type f -exec sed -i 's|http://localhost:3000/|/|g' {} \\;
                    """
                    
                    // Cypress 테스트 환경 설정 - 환경 변수 사용
                    sh """
                    echo '{
                      "baseUrl": "${FRONTEND_URL}:${FRONTEND_TEST_PORT}"
                    }' > cypress.config.json
                    """
                    
                    // Cypress 테스트 실행
                    sh 'npm install cypress --save-dev'
                    sh 'npx cypress run'
                }
            }
        }

        // 테스트 성공 시 프로덕션 환경에 프론트엔드 배포
        stage('Deploy Frontend to Production') {
            steps {
                echo "🚀 Deploying frontend to production..."
                sh """
                ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
                    docker pull ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest
                    docker stop react-app || true
                    docker rm react-app || true
                    docker run -d -p ${FRONTEND_PROD_PORT}:80 --name react-app ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest
                    echo "프론트엔드 서비스 시작됨"
                '
                """
            }
        }
    }

    post {
        success {
            echo "🎉 Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed. Check the logs."
        }
    }
}