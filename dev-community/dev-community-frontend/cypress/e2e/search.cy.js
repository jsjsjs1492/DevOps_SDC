describe('게시글 검색 기능 (전체 & 인기)', () => {
  const existingKeyword = 'Cypress';
  const missingKeyword  = '없는검색어';

  before(() => {
    // commands.js에 정의된 기본 로그인 커맨드 사용
    cy.login();
  });

  context('전체 게시글 검색', () => {
    beforeEach(() => {
      cy.visit('/all-posts');
    });

    it('유효한 키워드로 검색 시, 제목에 키워드가 포함된 게시글만 보여야 한다', () => {
      // 검색창에 키워드 입력 & 검색 실행
      cy.get('input.search-input')           // 검색 input :contentReference[oaicite:0]{index=0}
        .clear()
        .type(existingKeyword);
      cy.get('button.search-btn')            // 검색 버튼 :contentReference[oaicite:1]{index=1}
        .click();

      // 결과 로딩 대기
      cy.get('main.posts-main', { timeout: 10000 }).should('exist');

      // 최소 1개 이상 결과 & 제목에 키워드 포함 확인
      cy.get('.post-item')
        .should('have.length.at.least', 1)
        .each($item => {
          cy.wrap($item)
            .find('.post-title')
            .should('contain.text', existingKeyword);
        });
    });

    it('검색 결과가 없으면 안내 문구가 보여야 한다', () => {
      // 없는 키워드 입력 & 검색
      cy.get('input.search-input').clear().type(missingKeyword);
      cy.get('button.search-btn').click();

      // “선택하신 태그나 검색어에 해당하는 게시글이 없습니다.” 확인
      cy.contains(
        '선택하신 태그나 검색어에 해당하는 게시글이 없습니다.'
      ).should('be.visible');
    });
  });

  context('인기 게시글 검색', () => {
    beforeEach(() => {
      cy.visit('/popular-posts');
    });

    it('유효한 키워드로 검색 시, 제목에 키워드가 포함된 게시글만 보여야 한다', () => {
      // 검색창에 키워드 입력 & 검색 실행
      cy.get('input.search-input')           // 검색 input :contentReference[oaicite:2]{index=2}
        .clear()
        .type(existingKeyword);
      cy.get('button.search-btn')            // 검색 버튼 :contentReference[oaicite:3]{index=3}
        .click();

      // 결과 로딩 대기
      cy.get('main.posts-main', { timeout: 10000 }).should('exist');

      // 최소 1개 이상 결과 & 제목에 키워드 포함 확인
      cy.get('.post-item')
        .should('have.length.at.least', 1)
        .each($item => {
          cy.wrap($item)
            .find('.post-title')
            .should('contain.text', existingKeyword);
        });
    });

    it('검색 결과가 없으면 게시글 목록이 비어 있어야 한다', () => {
      // 없는 키워드 입력 & 검색
      cy.get('input.search-input').clear().type(missingKeyword);
      cy.get('button.search-btn').click();

      // 결과 로딩 대기
      cy.get('main.posts-main', { timeout: 10000 }).should('exist');

      // .post-item이 없어야 함
      cy.get('.post-item').should('have.length', 0);

      // 페이지네이션 버튼도 없어야 함
      cy.get('.pagination button').should('have.length', 0);
    });
  });
});
