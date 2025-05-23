pipeline {
    agent any

    environment {
        // 백엔드 관련 환경 변수
        BACKEND_IMAGE = 'dev-community-backend'
        BACKEND_SERVER = "ubuntu@52.78.59.185"
        BACKEND_PORT = "8081"
        BACKEND_URL = "http://52.78.59.185"
        BACKEND_API_URL = "${BACKEND_URL}:${BACKEND_PORT}"

        // 프론트엔드 관련 환경 변수
        FRONTEND_IMAGE = 'dev-community-frontend'
        FRONTEND_SERVER = "ubuntu@13.124.40.201"
        FRONTEND_URL = "http://13.124.40.201"
        FRONTEND_TEST_PORT = '3000'
        FRONTEND_PROD_PORT = '80'

        // Docker 관련
        DOCKER_REGISTRY = 'jangker'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Pull from GitHub') {
            steps {
                echo "📥 Pulling latest code from GitHub..."
                git branch: 'develop', url: 'https://github.com/jsjsjs1492/deploy_test.git'
            }
        }

        stage('Build & Push Backend Docker Image') {
            steps {
                echo "🛠️ Building backend Docker image..."
                dir('dev-community/dev-community-backend') {
                    script {
                        docker.withRegistry('', 'dockerhub-credential') {
                            def backendImage = docker.build("${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest",
                                "-f Dockerfile_backend .")
                            backendImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend Docker Image') {
            steps {
                echo "🛠️ Building frontend Docker image..."
                dir('dev-community/dev-community-frontend') {
                    sh 'mkdir -p nginx'

                    sh """
                    echo 'server {
                        listen 80;
                        location / {
                            root /usr/share/nginx/html;
                            index index.html index.htm;
                            try_files \$uri \$uri/ /index.html;
                        }
                        location /api {
                            proxy_pass http://backend:${BACKEND_PORT};
                            proxy_http_version 1.1;
                            proxy_set_header Upgrade \$http_upgrade;
                            proxy_set_header Connection "upgrade";
                            proxy_set_header Host \$host;
                            proxy_cache_bypass \$http_upgrade;
                        }
                    }' > nginx/default.conf
                    """

                    script {
                        docker.withRegistry('', 'dockerhub-credential') {
                            def frontendImage = docker.build("${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest",
                                "--build-arg REACT_APP_API_URL=http://backend:${BACKEND_PORT} -f Dockerfile_frontend .")
                            frontendImage.push('latest')
                        }
                    }
                }
            }
        }

        stage('Deploy Backend with Docker Compose') {
            steps {
                echo "🚀 Deploying backend..."
                sh """
                scp -o StrictHostKeyChecking=no docker-compose.yml ${BACKEND_SERVER}:/home/ubuntu/deploy/
                ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
                    cd /home/ubuntu/deploy
                    export BACKEND_IMAGE=${BACKEND_IMAGE}
                    export DOCKER_REGISTRY=${DOCKER_REGISTRY}
                    export BACKEND_PORT=${BACKEND_PORT}
                    docker-compose pull backend
                    docker-compose up -d backend
                    for i in {1..10}; do curl -sSf http://localhost:${BACKEND_PORT}/health && break || sleep 5; done
                '
                """
            }
        }

        stage('Deploy Frontend with Docker Compose') {
            steps {
                echo "🚀 Deploying frontend..."
                sh """
                scp -o StrictHostKeyChecking=no docker-compose.yml ${FRONTEND_SERVER}:/home/ubuntu/deploy/
                ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
                    cd /home/ubuntu/deploy
                    export FRONTEND_IMAGE=${FRONTEND_IMAGE}
                    export DOCKER_REGISTRY=${DOCKER_REGISTRY}
                    export FRONTEND_PROD_PORT=${FRONTEND_PROD_PORT}
                    docker-compose pull frontend
                    docker-compose up -d frontend
                    for i in {1..10}; do curl -sSf http://localhost:${FRONTEND_PROD_PORT} && break || sleep 5; done
                '
                """
            }
        }

        stage('Run E2E Tests') {
            steps {
                echo "🧪 Running Cypress E2E tests..."
                dir('dev-community/dev-community-frontend') {
                    sh """
                    find cypress/e2e -name "*.cy.js" -type f -exec sed -i 's|http://localhost:3000/|/|g' {} \\;
                    echo '{
                      "baseUrl": "${FRONTEND_URL}:${FRONTEND_TEST_PORT}"
                    }' > cypress.config.json
                    npm install cypress --save-dev
                    npx cypress run
                    """
                }
            }
        }

        stage('Deploy Frontend to Production') {
            steps {
                echo "🚀 Final frontend deployment..."
                sh """
                ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
                    docker pull ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest
                    docker stop react-app || true
                    docker rm react-app || true
                    docker run -d -p ${FRONTEND_PROD_PORT}:80 --name react-app ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest
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
