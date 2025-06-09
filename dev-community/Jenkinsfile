pipeline {
  agent any

  environment {
    DOCKER_REGISTRY   = 'jangcker'
    BACKEND_IMAGE     = 'dev-community-backend'
    FRONTEND_IMAGE    = 'dev-community-frontend'
    BACKEND_SERVER    = 'ubuntu@52.78.59.185'
    FRONTEND_SERVER   = 'ubuntu@13.124.40.201'
    BACKEND_PORT      = '8081'
    FRONTEND_PORT     = '5002'
    BACKEND_URL       = "52.78.59.185"
    FRONTEND_URL      = "13.124.40.201"
    MAIL_USERNAME   = 'jesjsjes@sogang.ac.kr'
    MAIL_PASSWORD   = 'wndrnrwlq1492@'
  }

  stages {
    stage('0-1. 백엔드 컨테이너 정리') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
              cd /home/ubuntu/deploy &&

              export DOCKER_REGISTRY="${DOCKER_REGISTRY}"
              export BACKEND_IMAGE="${BACKEND_IMAGE}"
              export BACKEND_PORT="${BACKEND_PORT}"

              export SPRING_DATASOURCE_URL="jdbc:mysql://db:3306/dev_community?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"
              export SPRING_DATASOURCE_USERNAME="root"
              export SPRING_DATASOURCE_PASSWORD="1234"

              export MAIL_HOST="mail.sogang.ac.kr"
              export MAIL_PORT="465"
              export MAIL_USERNAME="${MAIL_USERNAME}"
              export MAIL_PASSWORD="${MAIL_PASSWORD}"

              docker compose -f docker-compose.backend.yml down || true
            '
          """
        }
      }
    }

    stage('0-2. 프론트 컨테이너 정리') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
              cd /home/ubuntu/deploy &&

              export DOCKER_REGISTRY="${DOCKER_REGISTRY}"
              export FRONTEND_IMAGE="${FRONTEND_IMAGE}"
              export FRONTEND_PORT="${FRONTEND_PORT}"

              docker compose -f docker-compose.frontend.yml down --remove-orphans || true
              docker compose -f docker-compose.frontend.yml down || true
            '
          """
        }
      }
    }

    stage('1. GitHub 코드 Pull') {
      steps {
        git credentialsId: 'github-credentials',
            url: 'https://github.com/jsjsjs1492/deploy_test.git',
            branch: 'main'
      }
    }

    stage('2. React 테스트용 .env.production 생성 (프론트)') {
      steps {
        dir('dev-community/dev-community-frontend') {
          writeFile file: '.env.production', text: """
REACT_APP_API_URL=http://backend:8081
"""
        }
      }
    }

    stage('3. Docker 이미지 빌드 및 Push') {
      steps {
        script {
          docker.withRegistry('', 'dockerhub-credential') {
            sh 'docker build -t ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest dev-community/dev-community-backend'
            sh 'docker build -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest dev-community/dev-community-frontend'
            sh 'docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest'
            sh 'docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest'
          }
        }
      }
    }

    stage('4-5. 젠킨스 로컬에서 Cypress E2E Test') {
      steps {
        dir('dev-community/') {
          sh 'docker compose -f docker-compose.test.yml up --exit-code-from cypress'
        }
      }
    }

    stage('6. Test Containers Down') {
      steps {
        dir('dev-community/') {
          sh 'docker compose -f docker-compose.test.yml down'
          sh 'docker system prune -f'
          sh 'docker volume prune -f'
        }
      }
    }

    stage('7. React 배포용 .env.production 덮어쓰기기 (프론트)') {
      steps {
        dir('dev-community/dev-community-frontend') {
          writeFile file: '.env.production', text: """
REACT_APP_API_URL=http://${BACKEND_URL}:${BACKEND_PORT}
"""
        }
      }
    }

    stage('8. 프론트 Docker 이미지 리리빌드 및 Push') {
      steps {
        script {
          docker.withRegistry('', 'dockerhub-credential') {
            sh 'docker build -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest dev-community/dev-community-frontend'
            sh 'docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest'
          }
        }
      }
    }

    stage('9. 리모트 서버에 Compose 파일 전송') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} 'mkdir -p /home/ubuntu/deploy'
            scp ./dev-community/docker-compose.backend.yml ${BACKEND_SERVER}:/home/ubuntu/deploy/
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} 'mkdir -p /home/ubuntu/deploy'
            scp ./dev-community/docker-compose.frontend.yml ${FRONTEND_SERVER}:/home/ubuntu/deploy/
          """
        }
      }
    }

    stage('10. 백엔드 및 DB 서버 기동') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
              cd /home/ubuntu/deploy &&

              export DOCKER_REGISTRY="${DOCKER_REGISTRY}"
              export BACKEND_IMAGE="${BACKEND_IMAGE}"
              export BACKEND_PORT="${BACKEND_PORT}"

              export SPRING_DATASOURCE_URL="jdbc:mysql://db:3306/dev_community?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"
              export SPRING_DATASOURCE_USERNAME="root"
              export SPRING_DATASOURCE_PASSWORD="1234"

              export MAIL_HOST="mail.sogang.ac.kr"
              export MAIL_PORT="465"
              export MAIL_USERNAME="${MAIL_USERNAME}"
              export MAIL_PASSWORD="${MAIL_PASSWORD}"

              docker compose -f docker-compose.backend.yml down || true &&
              docker compose -f docker-compose.backend.yml pull &&
              docker compose -f docker-compose.backend.yml up -d
            '
          """
        }
      }
    }

    stage('11. 프론트 기동') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
              cd /home/ubuntu/deploy &&

              export DOCKER_REGISTRY="${DOCKER_REGISTRY}"
              export FRONTEND_IMAGE="${FRONTEND_IMAGE}"
              export FRONTEND_PORT="${FRONTEND_PORT}"

              docker compose -f docker-compose.frontend.yml down --remove-orphans || true
              docker compose -f docker-compose.frontend.yml down || true
              docker compose -f docker-compose.frontend.yml pull
              docker compose -f docker-compose.frontend.yml up -d frontend
            '
          """
        }
      }
    }
  }

  post {
    success {
      echo "✅ 전체 배포 및 테스트 성공"
    }
    failure {
      echo "❌ 실패: 로그를 확인하세요"
    }
  }
}
