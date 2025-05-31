pipeline {
  agent any

  environment {
    DOCKER_REGISTRY   = 'jangcker'
    BACKEND_IMAGE     = 'dev-community-backend'
    FRONTEND_IMAGE    = 'dev-community-frontend'
    BACKEND_SERVER    = 'ubuntu@52.78.59.185'
    FRONTEND_SERVER   = 'ubuntu@13.124.40.201'
    BACKEND_PORT      = '8081'
    FRONTEND_PORT     = '80'
    BACKEND_URL       = "52.78.59.185"
    FRONTEND_URL      = "13.124.40.201"
  }

  stages {
    // ================================================================
    stage('1. GitHub 코드 Pull') {
      steps {
        git credentialsId: 'github-credentials',
            url: 'https://github.com/jsjsjs1492/deploy_test.git',
            branch: 'main'
      }
    }

    // ================================================================
    stage('2. React .env.production 생성 (프론트)') {
      steps {
        dir('dev-community/dev-community-frontend') {
          writeFile file: '.env.production', text: """
REACT_APP_API_URL=http://${BACKEND_URL}:${BACKEND_PORT}
"""
        }
      }
    }

    // ================================================================
    stage('3. Docker 이미지 빌드 및 Push') {
      steps {
        script {
          docker.withRegistry('', 'dockerhub-credential') {
            // 백엔드 이미지 빌드
            sh 'docker build -t ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest dev-community/dev-community-backend'
            // 프론트엔드 이미지 빌드
            sh 'docker build -t ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest dev-community/dev-community-frontend'
            // Docker Hub에 Push
            sh 'docker push ${DOCKER_REGISTRY}/${BACKEND_IMAGE}:latest'
            sh 'docker push ${DOCKER_REGISTRY}/${FRONTEND_IMAGE}:latest'
          }
        }
      }
    }

    // ================================================================
    stage('4. 리모트 서버에 Compose 파일 전송') {
      steps {
        sshagent(['admin']) {
          sh """
            # 백엔드 서버에 디렉토리 생성 및 Compose 파일 복사
            ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} 'mkdir -p /home/ubuntu/deploy'
            scp ./docker-compose.backend.yml ${BACKEND_SERVER}:/home/ubuntu/deploy/

            # 프론트엔드 서버에 디렉토리 생성 및 Compose 파일 복사
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} 'mkdir -p /home/ubuntu/deploy'
            scp ./docker-compose.frontend.yml ${FRONTEND_SERVER}:/home/ubuntu/deploy/
          """
        }
      }
    }

    // ================================================================
    stage('5. 백엔드 및 DB 서버 기동 (SSH 내 export)') {
      steps {
        sshagent(['admin']) {
          withCredentials([
            // Jenkins에 등록된 DB credential (ID: prod-spring-datasource)
            usernamePassword(credentialsId: 'prod-spring-datasource',
                             usernameVariable: 'DB_USER',
                             passwordVariable: 'DB_PASS'),
            // Jenkins에 등록된 메일 credential (ID: prod-mail-account)
            usernamePassword(credentialsId: 'prod-mail-account',
                             usernameVariable: 'MAIL_USER',
                             passwordVariable: 'MAIL_PASS')
          ]) {
            sh """
              ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
                cd /home/ubuntu/deploy &&

                ################################################################################
                # 1) DB 연결 환경 변수 export
                ################################################################################
                export SPRING_DATASOURCE_URL="jdbc:mysql://db:3306/dev_community?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"
                export SPRING_DATASOURCE_USERNAME="${DB_USER}"
                export SPRING_DATASOURCE_PASSWORD="${DB_PASS}"

                ################################################################################
                # 2) Mail 서버 환경 변수 export
                ################################################################################
                export MAIL_HOST="mail.sogang.ac.kr"
                export MAIL_PORT="465"
                export MAIL_USERNAME="${MAIL_USER}"
                export MAIL_PASSWORD="${MAIL_PASS}"

                ################################################################################
                # 3) Docker Compose: 기존 컨테이너 종료 → 최신 이미지 Pull → 신규 기동
                ################################################################################
                docker compose -f docker-compose.backend.yml down || true &&
                docker compose -f docker-compose.backend.yml pull &&
                docker compose -f docker-compose.backend.yml up -d
              '
            """
          }
        }
      }
    }

    // ================================================================
    stage('6. 프론트엔드 서버 기동') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
              cd /home/ubuntu/deploy &&

              # (필요할 경우) 프론트 환경 변수 export
              # 예: export REACT_APP_API_URL="http://${BACKEND_URL}:${BACKEND_PORT}"

              # Docker Compose: Pull → Up (orphan 제거 포함)
              docker compose -f docker-compose.frontend.yml pull &&
              docker compose -f docker-compose.frontend.yml up -d --remove-orphans
            '
          """
        }
      }
    }

    // ================================================================
    stage('7. Cypress E2E 테스트 실행') {
      steps {
        sh '''
          # ────────────────────────────────────────────────────────────────
          # 기존 Cypress 컨테이너(남아있는 테스트 컨테이너) 정리
          # ────────────────────────────────────────────────────────────────
          docker ps -a --filter ancestor=cypress/included:12.0.0 \
            --format "{{.ID}}" | xargs -r docker rm -f

          echo "📦 Running Cypress E2E tests in Docker..."
          docker run --rm \
            -v "$PWD/dev-community/dev-community-frontend:/e2e" \
            -w /e2e \
            cypress/included:12.0.0 \
            npx cypress run --config baseUrl=http://${FRONTEND_URL}
        '''
      }
    }
  } // stages

  // ================================================================
  post {
    success {
      echo "✅ 전체 배포 및 테스트 성공"
    }
    failure {
      echo "❌ 실패: 로그를 확인하세요"
    }
  }
} // pipeline
