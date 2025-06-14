describe('태그 필터링 E2E 테스트', () => {
  const tagName = 'React';

  before(() => {
    // 로그인 (commands.js에 기본값으로 정의된 cy.login())
    cy.login();
  });

  it(`사이드바에서 "${tagName}" 태그 클릭 시 올바르게 필터링 돼야 한다`, () => {
    // 1) 메인 페이지 방문
    cy.visit('/main');

    // 2) 사이드바에 있는 태그 클릭
    cy.contains('.tag', tagName)
      .should('be.visible')
      .click();

    // 3) 올바른 쿼리 파라미터 확인
    cy.url().should('include', `/all-posts?tag=${tagName}`);

    // 4) API 호출 & 로딩 스피너 사라질 때까지 대기
    cy.get('.loading-spinner', { timeout: 10000 }).should('not.exist');

    // 5) 결과 유무에 따라 검증
    cy.get('.post-item').then($posts => {
      if ($posts.length > 0) {
        // 게시물이 있으면, 각 포스트마다 within()으로 재-쿼리
        cy.get('.post-item').each($post => {
          cy.wrap($post).within(() => {
            cy.get('.post-tag')
              .should('contain.text', tagName);
          });
        });
      } else {
        // 없으면 빈 상태 문구 확인
        cy.contains(
          '선택하신 태그나 검색어에 해당하는 게시글이 없습니다.'
        ).should('be.visible');
      }
    });
  });
});