before(() => {
  console.log('🔥 Cypress baseUrl:', Cypress.config('baseUrl'));
});

describe('로그인 테스트', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('성공: cypress 계정 로그인 → /main 이동', () => {
    cy.get('form#login-in').within(() => {
      cy.get('input[placeholder="ID"]').type('cypress')
      cy.get('input[placeholder="Password"]').type('cypress')
      cy.get('button[type="submit"]').click()
    })

    cy.url().should('include', '/main')
  })

  it('실패: 잘못된 비밀번호 → 에러 메시지 표시', () => {
    cy.get('form#login-in').within(() => {
      cy.get('input[placeholder="ID"]').type('cypress')
      cy.get('input[placeholder="Password"]').type('wrongpass')
      cy.get('button[type="submit"]').click()
    })

    cy.get('.login__error').should('contain', '아이디 또는 비밀번호를 확인하세요')
  })
})
