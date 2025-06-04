package com.letsgo.devcommunity.domain.member.service;

import com.letsgo.devcommunity.domain.member.dto.FollowMemberResponse;
import com.letsgo.devcommunity.domain.member.dto.MemberProfileResponse;
import com.letsgo.devcommunity.domain.member.entity.Follow;
import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.member.repository.FollowRepository;
import com.letsgo.devcommunity.domain.member.repository.MemberRepository;
import com.letsgo.devcommunity.domain.post.repository.PostLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.letsgo.devcommunity.domain.member.constants.MemberErrorMessages.*;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final FollowRepository followRepository;
//    private final PostLikeRepository postLikeRepository;

    @Transactional
    public MemberProfileResponse getProfile(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(NOT_FOUND_MEMBER));
        int followerCount = followRepository.countByToMember(member);
        int followingCount = followRepository.countByFromMember(member);
//        int receivedLikeCount = postLikeRepository.calculateTotalLikesByUserId(member.getId());
        int receivedLikeCount = 0;

        return new MemberProfileResponse(
                member.getNickname(),
                member.getProfileImageUrl(),
                followerCount,
                followingCount,
                receivedLikeCount
        );
    }

    @Transactional
    public void follow(String targetLoginId, Long currentMemberId) {
        if(targetLoginId == null || targetLoginId.isEmpty()){
            throw new IllegalArgumentException(TARGET_ID_NULL_OR_EMPTY);
        }

        Member from = memberRepository.findById(currentMemberId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_ME));
        Member to = memberRepository.findByLoginId(targetLoginId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_FOLLOW_TARGET));

        if (followRepository.existsByFromMemberAndToMember(from, to)) {
            throw new IllegalStateException(ALREADY_FOLLOWING);
        }

        followRepository.save(from.follow(to));
    }

    @Transactional
    public void unfollow(String targetLoginId, Long currentMemberId) {
        if(targetLoginId == null || targetLoginId.isEmpty()){
            throw new IllegalArgumentException(TARGET_ID_NULL_OR_EMPTY);
        }

        Member from = memberRepository.findById(currentMemberId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_ME));
        Member to = memberRepository.findByLoginId(targetLoginId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_UNFOLLOW_TARGET));

        followRepository.findByFromMemberAndToMember(from, to)
                .ifPresentOrElse(followRepository::delete, () -> {
                    throw new IllegalStateException(CANNOT_FIND_FOLLOW_RELATIONSHIP);
                });
    }

    @Transactional(readOnly = true)
    public List<FollowMemberResponse> getFollowers(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_ME));

        return followRepository.findAllByToMember(member).stream()
                .map(follow -> FollowMemberResponse.from(follow.getFromMember()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowMemberResponse> getFollowings(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_ME));

        return followRepository.findAllByFromMember(member).stream()
                .map(follow -> FollowMemberResponse.from(follow.getToMember()))
                .toList();
    }
}
