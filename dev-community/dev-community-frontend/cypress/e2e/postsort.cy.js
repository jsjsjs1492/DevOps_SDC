describe('마이페이지 게시글 테스트', () => {

  /* ---------- 공통: 로그인 후 /main 진입 ---------- */
  beforeEach(() => {
    // 1) 로그인 페이지
    cy.visit('http://localhost:3000/');

    cy.get('form#login-in').within(() => {
      cy.get('input[placeholder="ID"]').type('cypress');
      cy.get('input[placeholder="Password"]').type('cypress');
      cy.root().submit();
    });

    // 2) 메인 페이지 도착 확인
    cy.url().should('include', '/main');
  });

  /* ---------- A. 인기 게시글 좋아요순 정렬 ---------- */
  it('인기 게시글 페이지로 이동 후 좋아요 수 기준 정렬 확인', () => {
    cy.get('section.popular-posts')
      .find('.show-more-btn')
      .click();

    cy.url().should('include', '/popular-posts');

    cy.get('.post-item').should('have.length.at.most', 10);

    cy.get('.post-item').then(posts => {
      const likes = [];
      posts.each((_, el) => {
        const likeText = el.querySelector('.post-likes span')?.textContent || '0';
        likes.push(Number(likeText));
      });
      const isSorted = likes.every((v, i, arr) => i === 0 || arr[i - 1] >= v);
      expect(isSorted).to.be.true;
    });
  });

  /* ---------- B. 전체 게시글 최신순 정렬 ---------- */
  it('전체 게시글 페이지로 이동 후 최신순 정렬 확인', () => {
    cy.get('section.all-posts')
      .find('.show-more-btn')
      .click();

    cy.url().should('include', '/all-posts');

    cy.get('.post-item').should('have.length.at.most', 10);

    cy.get('.post-date').then(dateEls => {
      const dates = Array.from(dateEls).map(el => new Date(el.innerText));
      const isSorted = dates.every((d, i, arr) => i === 0 || arr[i - 1] >= d);
      expect(isSorted).to.be.true;
    });
  });
});
