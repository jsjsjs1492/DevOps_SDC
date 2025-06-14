describe('프로필 수정 플로우 (닉네임 & 비밀번호 변경)', () => {
  const originalNickname = '싸이프레스';
  const tempNickname     = '변경테스트';
  const originalPassword = 'Rightpass1!';
  const newPassword      = 'Changepass1!';

  before(() => {
    // 기본 로그인
    cy.login();
  });

  it('닉네임 변경 → 원복 → 비밀번호 변경 → 재로그인 → 비밀번호 원복', () => {
    // 1) 마이페이지로 이동 후 프로필 수정 페이지 열기
    cy.visit('/mypage');
    cy.get('button.edit-profile-btn').click();
    cy.url().should('include', '/edit-profile');

    // 2) 닉네임을 tempNickname으로 변경
    cy.get('input#nickname')
      .clear()
      .type(tempNickname);
    cy.on('window:alert', msg => {
      expect(msg).to.contain('닉네임이 성공적으로 변경되었습니다.');
    });
    cy.get('button.submit-button').contains('닉네임 변경').click();
    cy.get('h2.profile-nickname').should('contain.text', tempNickname);

    // 3) 닉네임을 originalNickname으로 원복
    cy.get('input#nickname')
      .clear()
      .type(originalNickname);
    cy.on('window:alert', msg => {
      expect(msg).to.contain('닉네임이 성공적으로 변경되었습니다.');
    });
    cy.get('button.submit-button').contains('닉네임 변경').click();
    cy.get('h2.profile-nickname').should('contain.text', originalNickname);

    // 4) 비밀번호를 newPassword로 변경
    cy.get('input#currentPassword')
      .clear()
      .type(originalPassword);
    cy.get('input#newPassword')
      .clear()
      .type(newPassword);
    cy.get('input#confirmPassword')
      .clear()
      .type(newPassword);
    cy.on('window:alert', msg => {
      expect(msg).to.contain('비밀번호가 성공적으로 변경되었습니다.');
    });
    cy.get('button.submit-button').contains('비밀번호 변경').click();

    // 5) 로그아웃
    cy.visit('/main');
    cy.get('button.logout-btn').click();
    cy.url().should('not.include', '/main');

    // 6) 새 비밀번호로 로그인
    cy.login({ pw: newPassword });
    cy.url().should('include', '/main');
    cy.contains(`${originalNickname}님`).should('exist');

    // 7) 비밀번호를 originalPassword로 원복
    cy.visit('/mypage');
    cy.get('button.edit-profile-btn').click();
    cy.get('input#currentPassword')
      .clear()
      .type(newPassword);
    cy.get('input#newPassword')
      .clear()
      .type(originalPassword);
    cy.get('input#confirmPassword')
      .clear()
      .type(originalPassword);
    cy.on('window:alert', msg => {
      expect(msg).to.contain('비밀번호가 성공적으로 변경되었습니다.');
    });
    cy.get('button.submit-button').contains('비밀번호 변경').click();

    // 8) 로그아웃 후 원래 비밀번호로 로그인
    cy.visit('/main');
    cy.get('button.logout-btn').click();
    cy.login();
    cy.url().should('include', '/main');
    cy.contains(`${originalNickname}님`).should('exist');
  });
});