pipeline {
  agent any

  // 환경 변수 정의: 이미지 이름, 서버 주소, 포트 등
  environment {
    DOCKER_REGISTRY = 'jangcker'

    BACKEND_IMAGE = 'dev-community-backend'
    FRONTEND_IMAGE = 'dev-community-frontend'

    BACKEND_SERVER = 'ubuntu@52.78.59.185'
    FRONTEND_SERVER = 'ubuntu@13.124.40.201'

    BACKEND_PORT = '8081'
    FRONTEND_PORT = '80'

    BACKEND_URL = "52.78.59.185"
    FRONTEND_URL = "13.124.40.201"
  }

  stages {

    stage('1. GitHub 코드 Pull') {
      // GitHub에서 최신 소스 코드 가져오기
      steps {
        git credentialsId: 'github-credentials',
            url: 'https://github.com/jsjsjs1492/deploy_test.git',
            branch: 'main'
      }
    }

    stage('2. .env.production 파일 생성') {
      // 프론트엔드 빌드용 환경변수 설정 파일 생성
      // 이 파일은 React 빌드 시 baseUrl 등으로 사용됨
      steps {
        dir('dev-community/dev-community-frontend') {
          writeFile file: '.env.production', text: """
REACT_APP_API_URL=${BACKEND_URL}:${BACKEND_PORT}
"""
        }
      }
    }

    stage('3. Docker Compose로 서비스 빌드 및 Push') {
      // docker-compose로 backend, frontend 이미지 빌드
      // 이후 Docker Hub로 push (도커 허브 credential 필요)
      steps {
        
        script {
          docker.withRegistry('', 'dockerhub-credential') {
            sh 'docker compose -f docker-compose.yml build'
            sh 'docker compose -f docker-compose.yml push'
          }
        }
        
      }
    }

    stage('4. 리모트 서버에 docker-compose 파일 및 관련 결과물 전송') {
      // docker-compose.yml 파일을 각 배포 서버로 복사
      steps {
        sshagent(['admin']) {
          sh """
          ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} 'mkdir -p /home/ubuntu/deploy'
          scp ./docker-compose.deploy.yml ${BACKEND_SERVER}:/home/ubuntu/deploy/
          
          ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} 'mkdir -p /home/ubuntu/deploy'
          scp ./docker-compose.deploy.yml ${FRONTEND_SERVER}:/home/ubuntu/deploy/
          """
        }
      }
    }

    stage('5. 백엔드 및 DB 서버 기동') {
      // 백엔드 서버에서 docker-compose up -d backend db 실행
      steps {
        sshagent(['admin']) {
          sh """
          ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
            cd /home/ubuntu/deploy &&
            export DOCKER_REGISTRY=${DOCKER_REGISTRY} &&
            export BACKEND_IMAGE=${BACKEND_IMAGE} &&
            export BACKEND_PORT=${BACKEND_PORT} &&
            docker compose -f docker-compose.deploy.yml pull backend db &&
            docker compose -f docker-compose.deploy.yml up -d backend db
          '
          """
        }
      }
    }

    stage('6. 프론트엔드 서버 기동') {
      // 프론트 서버에서 docker-compose up -d frontend 실행
      steps {
        sshagent(['admin']) {
          sh """
          ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
            cd /home/ubuntu/deploy &&
            export DOCKER_REGISTRY=${DOCKER_REGISTRY} &&
            export FRONTEND_IMAGE=${FRONTEND_IMAGE} &&
            export FRONTEND_PROD_PORT=${FRONTEND_PORT} &&
            docker compose -f docker-compose.deploy.yml pull frontend &&
            docker compose -f docker-compose.deploy.yml up -d frontend
          '
          """
        }
      }
    }

    stage('7. Cypress E2E 테스트 실행') {
      // 실제 배포된 프론트 주소를 기준으로 Cypress 테스트 실행
      steps {
        dir('dev-community/dev-community-frontend') {
          sh 'npm install cypress --save-dev'  // Cypress 설치
          sh 'npx cypress verify'              // 바이너리 확인
          sh "npx cypress run --config baseUrl=http://${FRONTEND_URL}"  // 테스트 실행
        }
      }
    }
  }

  post {
    // 파이프라인 전체 성공 시 메시지
    success {
      echo "✅ 전체 배포 및 테스트 성공"
    }
    // 실패 시 메시지
    failure {
      echo "❌ 실패: 로그를 확인하세요"
    }
  }
}
