// cypress/e2e/post-flow-one-shot.cy.js
describe('게시글 전 과정 – 원샷(한 it) 시나리오', () => {
  const title          = `싸이프레스 원샷 글 ${Date.now()}`;
  const content        = 'Cypress 한 블록 통합 테스트 본문';
  const updatedTitle   = `${title} (수정됨)`;
  const updatedContent = `${content} [수정된 내용]`;
  const commentText    = '원샷 댓글';

  it('새 글 작성 → 추천 → 댓글 작성/삭제 → 수정 → 삭제', () => {
    /* ---------- 로그인 ---------- */
    cy.visit('http://localhost:3000/');
    cy.get('form#login-in').within(() => {
      cy.get('input[placeholder="ID"]').type('cypress');
      cy.get('input[placeholder="Password"]').type('cypress');
      cy.root().submit();
    });
    cy.url().should('include', '/main');

    /* ---------- 1. 새 글 작성 ---------- */
    cy.contains('새 글 작성하기').click();
    cy.url().should('include', '/create-post');

    cy.get('input[placeholder="제목을 입력하세요"]').type(title);
    cy.get('textarea[placeholder="내용을 입력하세요"]').type(content);

    // API 대기(선택) ─ 성공 응답 200 확인
    cy.intercept('POST', '/post').as('createPost');
    cy.contains('작성 완료').click();
    cy.wait('@createPost').its('response.statusCode').should('eq', 200);

    // 상세 페이지 진입 확인
    cy.url().should('include', '/post/');
    cy.contains(title).should('exist');

    /* ---------- 2. 추천 ---------- */
    cy.get('.post-likes span').then($el => {
      const before = Number($el.text().trim());
      cy.contains('좋아요').click();
      cy.get('.post-likes span')
        .invoke('text')
        .then(Number)
        .should('eq', before + 1);
    });

    /* ---------- 3. 댓글 작성 ---------- */
    cy.get('textarea[placeholder="댓글을 작성하세요..."]').type(commentText);
    cy.contains('댓글 작성').click();
    cy.contains(commentText).should('exist');

    /* ---------- 4. 댓글 삭제 ---------- */
    cy.contains(commentText)
      .closest('li')
      .within(() => {
        cy.contains('삭제').click();
      });

    cy.contains(commentText).should('not.exist');   // 삭제 확인

    /* ---------- 5. 글 수정 ---------- */
    cy.contains('수정', { timeout: 10000 })   // 버튼이 DOM에 나타날 때까지 기다림
      .scrollIntoView()                      // (필요하다면) 화면에 보이게 스크롤
      .should('be.visible')
      .click();                              // 클릭 → /edit-post 로 이동

    cy.url().should('include', '/edit-post');

    cy.get('input[placeholder="제목을 입력하세요"]')
      .clear()
      .type(updatedTitle);

    cy.get('textarea[placeholder="내용을 입력하세요"]')
      .clear()
      .type(updatedContent);

    cy.contains('수정 완료').click();

    cy.contains(updatedTitle).should('exist');
    cy.contains(updatedContent).should('exist');


    /* ---------- 6. 글 삭제 ---------- */
    cy.contains('삭제').click();
    cy.on('window:confirm', () => true);             // 확인 팝업 자동 수락
    cy.url().should('match', /\/(main|all-posts)$/);
    cy.contains(updatedTitle).should('not.exist');   // 목록에서 사라졌는지 확인
  });
});
