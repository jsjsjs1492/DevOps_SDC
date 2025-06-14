// cypress/e2e/postsort.cy.js

describe('인기 게시글 정렬 검증', () => {
  beforeEach(() => {
    cy.login();              // 공통 로그인
    cy.visit('/main');       // 메인으로 이동
    cy.get('section.popular-posts')
      .find('button.show-more-btn')
      .click();
    cy.url().should('include', '/popular-posts');
  });

  it('좋아요 수 기준 내림차순으로 정렬되어야 한다', () => {
    let prev = Number.POSITIVE_INFINITY;

    cy.get('.post-item').each(($el) => {
      // 각 게시글의 좋아요 수 텍스트를 숫자로 변환
      const count = Number($el.find('.post-likes span').text());
      expect(count).to.be.at.most(prev);
      prev = count;
    });
  });
});

describe('전체 게시글 정렬 검증', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/main');
    cy.get('section.all-posts')
      .find('button.show-more-btn')
      .click();
    cy.url().should('include', '/all-posts');
  });

  it('최신 생성일 기준 내림차순으로 정렬되어야 한다', () => {
    let prevDate = new Date().getTime();

    cy.get('.post-item').each(($el) => {
      const dateText = $el.find('.post-date').text(); // ex. "2025-06-14"
      const currDate = new Date(dateText).getTime();
      expect(currDate).to.be.at.most(prevDate);
      prevDate = currDate;
    });
  });
});
