package com.letsgo.devcommunity.global.util;

import com.letsgo.devcommunity.domain.member.entity.Member;

import jakarta.servlet.http.HttpSession;

public class SessionUtils {

    public static final String LOGIN_MEMBER = "loginMember";

    public static void setLoginMember(HttpSession session, Member member) {
        session.setAttribute(LOGIN_MEMBER, member);
    }

    public static Member getLoginMember(HttpSession session) {
        return (Member) session.getAttribute(LOGIN_MEMBER);
    }

    public static void logout(HttpSession session) {
        session.invalidate();
    }

    public static boolean isLoggedIn(HttpSession session) {
        return getLoginMember(session) != null;
    }
}

