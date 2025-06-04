package com.letsgo.devcommunity.domain.member.constants;

public final class MemberErrorMessages {
    public static final String NOT_FOUND_MEMBER = "존재하지 않는 사용자입니다.";
    public static final String CANNOT_FIND_ME = "로그인한 회원을 찾을 수 없습니다.";
    public static final String CANNOT_FIND_FOLLOW_TARGET = "팔로우 대상 회원을 찾을 수 없습니다.";
    public static final String CANNOT_FIND_UNFOLLOW_TARGET = "언팔로우 대상 회원을 찾을 수 없습니다.";
    public static final String ALREADY_FOLLOWING = "이미 팔로우한 사용자입니다.";
    public static final String CANNOT_FIND_FOLLOW_RELATIONSHIP = "팔로우 관계가 존재하지 않습니다.";
    public static final String CANNOT_FOLLOW_MYSELF = "자기 자신을 팔로우할 수 없습니다.";
    public static final String TARGET_ID_NULL_OR_EMPTY = "팔로우 대상 ID는 필수입니다.";

    private MemberErrorMessages() {
        // 인스턴스화 방지
    }
}
