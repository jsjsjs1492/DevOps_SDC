## CI/CD 파이프라인 문서 (Frontend)

# 파이프라인 구성
1. **Checkout**: GitHub develop 브랜치에서 코드 가져오기
2. **Clean Docker**: Docker 캐시 및 컨테이너 정리
3. **Build Docker Image & Push**: Docker Hub에 이미지 push
4. **Deploy**: 원격 서버에 SSH로 접속해 Docker 컨테이너 재시작

# 필요한 Credentials
- GitHub: `github-credentials`
- DockerHub: `dockerhub-credentials`
- SSH 키: Jenkins 서버의 ~/.ssh/id_rsa.pub 를 frontend 서버 authorized_keys 에 등록

# Github Webhook 설정
- Webhook URL: http://<서버 IP 주소>:8080/github-webhook/ (마지막 슬래시 주의)
- push 시 trigger
- Jenkins 각 파이프라인 구성 -> Triggers의 GitHub hook trigger for GITScm polling? 체크 필요
- Webhook 설정은 Github settings -> Webhook에서 설정 가능

# 사용 이미지
- node:20
- nginx:alpine

# 주의사항
- npm ci 실행 위해서는 package.json - package-lock.json 버전 일치 필요
