describe('게시글 작성 플로우 E2E 테스트', () => {

  before(() => {
    cy.log('🔥 Base URL:', Cypress.config('baseUrl'));
  });

  beforeEach(() => {
    // 1) 로그인
    cy.login();
  });

  it('새 글 작성 → 상세 페이지로 이동 → 내용 검증', () => {
    // 2) 새 글 작성 페이지로 이동
    cy.contains('새 글 작성하기').click();
    cy.url().should('include', '/create-post');

    // 3) 제목 입력
    cy.get('input#title')
      .should('be.visible')
      .clear()
      .type('Cypress E2E 테스트 게시글');

    // 4) 내용 입력: 오직 보이는 ProseMirror 만 선택
    cy.get('.ProseMirror:visible', { timeout: 10000 })
      .first()
      .click()  // force 없이도 작동할 거예요
      .type('이것은 Cypress 자동화 테스트를 위한 게시글입니다.');

    // 5) 태그 선택 (예: React)
    cy.contains('.tag-item', 'React')
      .should('be.visible')
      .click();

    // 6) 작성 버튼 클릭
    cy.get('button[type="submit"]')
      .contains(/작성|등록|완료/)   // 버튼 텍스트에 맞춰 조정
      .click();

    // 7) 상세 페이지로 리다이렉트 확인
    cy.url().should('match', /\/post\/\d+$/);

    // 8) 작성한 제목 & 내용이 보이는지 검증
    cy.contains('Cypress E2E 테스트 게시글').should('exist');
    cy.contains('이것은 Cypress 자동화 테스트를 위한 게시글입니다.').should('exist');

    // 9) 댓글 작성
    cy.get('textarea[placeholder="댓글을 작성하세요..."]')
      .should('be.visible')
      .type('댓글 테스트입니다.');
    cy.get('button').contains('댓글 작성').click();
    cy.contains('댓글 테스트입니다.').should('exist');

    // 10) 댓글 삭제
    cy.contains('댓글 테스트입니다.')
      .parent()                           // <li> 요소까지 올라가서
      .find('button.delete-comment-btn')  // PostDetail.jsx 의 삭제 버튼 클래스
      .click();
    cy.contains('댓글 테스트입니다.').should('not.exist');

    // 11) 게시글 좋아요 테스트
    cy.get('.post-likes button').click();
    cy.get('.post-likes span')
      .invoke('text')
      .then(text => parseInt(text, 10))
      .should(val => expect(val).to.be.greaterThan(0));

    // 12) 게시글 좋아요 취소
    cy.get('.post-likes button').click();
    cy.get('.post-likes span')
      .invoke('text')
      .then(text => parseInt(text, 10))
      .should(val => expect(val).to.eq(0));
  });
});