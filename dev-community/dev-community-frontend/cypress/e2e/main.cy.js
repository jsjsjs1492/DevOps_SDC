describe('/main 페이지 테스트', () => {
  const testUser = { loginId: 'cypress', nickname: '싸이프레스' };

  /* ---------------- 공통 로그인 ---------------- */
  beforeEach(() => {
    cy.visit('http://localhost:3000/');

    cy.get('form#login-in').within(() => {
      cy.get('input[placeholder="ID"]').type(testUser.loginId);
      cy.get('input[placeholder="Password"]').type('cypress');
      cy.root().submit();
    });

    cy.url().should('include', '/main');
  });

  /* 1. 메인 섹션 확인 */
  it('섹션들이 화면에 표시된다', () => {
    cy.contains(testUser.nickname).should('exist');
    cy.contains('인기 게시글').should('exist');
    cy.contains('전체 게시글').should('exist');
  });

  /* 2. 게시글 상세 진입 */
  it('게시글 클릭 시 상세 페이지로 이동한다', () => {
    cy.get('.post-item').first().scrollIntoView().click();
    cy.url().should('include', '/post/');
  });

  /* 3. 마이페이지 진입 */
  it('헤더의 마이페이지 링크를 클릭하면 /mypage 로 이동한다', () => {
    // 헤더 링크 예: <a href="/mypage">마이페이지</a>
    cy.contains('마이페이지').click();
    cy.url().should('include', '/mypage');
    cy.contains(`${testUser.nickname}`).should('exist'); // 예시 확인 항목
  });

  /* 4. localStorage 유지 → 로그아웃 → 초기화 */
  it('localStorage에 사용자 정보가 유지되고 로그아웃 시 초기화된다', () => {
    cy.window().then(win => {
      expect(JSON.parse(win.localStorage.getItem('user'))).to.deep.equal(testUser);
    });

    cy.contains('로그아웃').click();
    cy.url().should('eq', 'http://localhost:3000/');
    cy.window().then(win => {
      expect(win.localStorage.getItem('user')).to.be.null;
    });
  });
});
