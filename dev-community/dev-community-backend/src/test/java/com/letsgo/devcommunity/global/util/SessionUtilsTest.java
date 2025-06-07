package com.letsgo.devcommunity.global.util;

import com.letsgo.devcommunity.domain.member.entity.Member;
import jakarta.servlet.http.HttpSession;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionUtilsTest {

    @Mock
    private HttpSession session;

    @Mock
    private Member member;

    @Test
    @DisplayName("로그인 멤버 세션 저장 성공")
    void setLoginMember_Success() {
        SessionUtils.setLoginMember(session, member);
        verify(session).setAttribute(SessionUtils.LOGIN_MEMBER, member);
    }

    @Test
    @DisplayName("로그인 멤버 세션 조회 성공")
    void getLoginMember_Success() {
        when(session.getAttribute(SessionUtils.LOGIN_MEMBER)).thenReturn(member);

        Member result = SessionUtils.getLoginMember(session);

        verify(session).getAttribute(SessionUtils.LOGIN_MEMBER);
        assertThat(result).isEqualTo(member);
    }

    @Test
    @DisplayName("로그아웃 성공")
    void logout_Success() {
        SessionUtils.logout(session);
        verify(session).invalidate();
    }

    @Test
    @DisplayName("로그인 상태 확인: 로그인된 경우")
    void isLoggedIn_True() {
        when(session.getAttribute(SessionUtils.LOGIN_MEMBER)).thenReturn(member);

        boolean result = SessionUtils.isLoggedIn(session);

        verify(session).getAttribute(SessionUtils.LOGIN_MEMBER);
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("로그인 상태 확인: 로그인되지 않은 경우")
    void isLoggedIn_False() {
        when(session.getAttribute(SessionUtils.LOGIN_MEMBER)).thenReturn(null);

        boolean result = SessionUtils.isLoggedIn(session);

        verify(session).getAttribute(SessionUtils.LOGIN_MEMBER);
        assertThat(result).isFalse();
    }

}