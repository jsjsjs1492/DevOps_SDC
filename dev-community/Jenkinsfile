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
          
            sh """
              ssh -o StrictHostKeyChecking=no ${BACKEND_SERVER} '
                cd /home/ubuntu/deploy &&

                export DOCKER_REGISTRY="jangcker"
                export BACKEND_IMAGE="dev-community-backend"
                export BACKEND_PORT="8081"

                ################################################################################
                # 1) DB 연결 환경 변수 export
                ################################################################################
                export SPRING_DATASOURCE_URL="jdbc:mysql://db:3306/dev_community?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8"
                export SPRING_DATASOURCE_USERNAME="root"
                export SPRING_DATASOURCE_PASSWORD="1234"

                ################################################################################
                # 2) Mail 서버 환경 변수 export
                ################################################################################
                export MAIL_HOST="mail.sogang.ac.kr"
                export MAIL_PORT="465"
                export MAIL_USERNAME="jesjsjes"
                export MAIL_PASSWORD="wndrnrwlq1492@"

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

    // ================================================================
    stage('6. 프론트엔드 서버 기동') {
      steps {
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
              cd /home/ubuntu/deploy &&

              # (필요할 경우) 프론트 환경 변수 export
              # 예: export REACT_APP_API_URL="http://${BACKEND_URL}:${BACKEND_PORT}"

              export DOCKER_REGISTRY="jangcker"
              export FRONTEND_IMAGE="dev-community-frontend"
              

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
        // ❶ SSH 키만 붙여서 SSH 에이전트 실행
        sshagent(['admin']) {
          sh """
            ssh -o StrictHostKeyChecking=no ${FRONTEND_SERVER} '
              cd /home/ubuntu/deploy &&

              # ───────────────────────────────────────────────────────────────────────
              # 1) 혹시 남아 있는 Cypress 또는 프론트 컨테이너가 있으면 모두 내린다.
              # ───────────────────────────────────────────────────────────────────────
              docker compose -f docker-compose.frontend.yml down --remove-orphans || true

              # ───────────────────────────────────────────────────────────────────────
              # 2) "frontend" 컨테이너만 올려둔다 (테스트를 위한 정적 파일 서빙 준비).
              #    (미리 이미지는 pull 되어 있다고 가정)
              # ───────────────────────────────────────────────────────────────────────
              docker compose -f docker-compose.frontend.yml up -d frontend

              # ───────────────────────────────────────────────────────────────────────
              # 3) Cypress 서비스만 실행 → 완료되면 exit code 반환
              #    --exit-code-from 옵션을 주면, cypress 서비스가 종료될 때
              #    자동으로 모든 서비스(frontend 포함)를 같이 내립니다.
              # ───────────────────────────────────────────────────────────────────────
              docker compose -f docker-compose.frontend.yml up --exit-code-from cypress cypress
            '
          """
        }
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
