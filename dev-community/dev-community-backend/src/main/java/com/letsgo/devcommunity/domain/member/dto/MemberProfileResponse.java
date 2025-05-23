package com.letsgo.devcommunity.domain.member.dto;

public record MemberProfileResponse(
        String nickname,
        String profileImageUrl,
        int followerCount,
        int followingCount,
        int receivedLikeCount
) { }
