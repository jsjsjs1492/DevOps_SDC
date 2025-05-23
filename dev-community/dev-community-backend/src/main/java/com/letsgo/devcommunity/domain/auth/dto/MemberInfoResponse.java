package com.letsgo.devcommunity.domain.auth.dto;

import com.letsgo.devcommunity.domain.member.entity.Member;

public record MemberInfoResponse(
        Long id,
        String loginId,
        String nickname
) {
    public MemberInfoResponse(Member member) {
        this(member.getId(), member.getLoginId(), member.getNickname());
    }
}

