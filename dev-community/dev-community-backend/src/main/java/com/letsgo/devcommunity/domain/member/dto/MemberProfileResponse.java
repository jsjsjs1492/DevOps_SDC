package com.letsgo.devcommunity.domain.member.dto;

public record MemberProfileResponse(
        Long id,
        String loginId,
        String nickname,
        String profileImageUrl,
        int followerCount,
        int followingCount,
        long receivedLikeCount
) { }
