// cypress/e2e/post-edit-delete.cy.js

describe('게시글 수정 후 삭제까지 E2E 플로우', () => {
  const originalTitle = 'Cypress E2E 테스트 게시글';
  const updatedTitle  = '수정된 Cypress 테스트 게시글';
  const updatedBody   = '수정된 내용입니다.';

  before(() => {
    // commands.js에 정의된 로그인 커맨드 재사용
    cy.login();
  });

  it('1) 게시글 상세로 이동 → 2) 수정 → 3) 수정 반영 확인 → 4) 삭제 → 5) 삭제 확인', () => {
    // 1) 메인에서 원본 글 클릭
    cy.visit('/main');
    cy.contains(originalTitle)
      .should('be.visible')
      .click();
    cy.url().should('match', /\/post\/\d+$/);

    // 2) 수정 페이지로 이동
    cy.get('button').contains('수정').click();
    cy.url().should('include', '/edit');

    // 3) 제목·내용 수정
    cy.get('input#title')
      .clear()
      .type(updatedTitle);
    cy.get('.ProseMirror:visible')
      .click()
      .clear()
      .type(updatedBody);
    cy.get('button[type="submit"]')
      .contains(/수정 완료|완료|등록/)
      .click();

    // 4) 상세페이지로 돌아와서 수정 반영 확인
    cy.url().should('match', /\/post\/\d+$/);
    cy.contains(updatedTitle).should('exist');
    cy.contains(updatedBody).should('exist');

    // 5) 삭제 버튼 클릭 후 confirm 처리
    cy.get('button').contains('삭제').click();
    cy.on('window:confirm', () => true);

    // 6) 메인으로 리다이렉트 & 삭제 확인
    cy.url().should('eq', Cypress.config('baseUrl') + '/main');
    cy.contains(updatedTitle).should('not.exist');
  });
});
