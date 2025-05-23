package com.letsgo.devcommunity.domain.member.dto;

import com.letsgo.devcommunity.domain.member.entity.Member;

public record FollowMemberResponse(
        String loginId,
        String nickname,
        String profileImageUrl
) {
    public static FollowMemberResponse from(Member member) {
        return new FollowMemberResponse(
                member.getLoginId(),
                member.getNickname(),
                member.getProfileImageUrl()
        );
    }
}
