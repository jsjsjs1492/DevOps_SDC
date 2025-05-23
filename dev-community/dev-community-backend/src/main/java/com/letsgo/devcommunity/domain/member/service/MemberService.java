package com.letsgo.devcommunity.domain.member.service;

import com.letsgo.devcommunity.domain.member.dto.FollowMemberResponse;
import com.letsgo.devcommunity.domain.member.dto.MemberProfileResponse;
import com.letsgo.devcommunity.domain.member.entity.Follow;
import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.member.repository.FollowRepository;
import com.letsgo.devcommunity.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final FollowRepository followRepository;

    @Transactional
    public MemberProfileResponse getProfile(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        int followerCount = followRepository.countByToMember(member);
        int followingCount = followRepository.countByFromMember(member);
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
        Member from = memberRepository.findById(currentMemberId)
                .orElseThrow(() -> new IllegalArgumentException("로그인한 회원을 찾을 수 없습니다."));
        Member to = memberRepository.findByLoginId(targetLoginId)
                .orElseThrow(() -> new IllegalArgumentException("팔로우 대상 회원을 찾을 수 없습니다."));

        if (followRepository.existsByFromMemberAndToMember(from, to)) {
            throw new IllegalStateException("이미 팔로우한 사용자입니다.");
        }

        followRepository.save(from.follow(to));
    }

    @Transactional
    public void unfollow(String targetLoginId, Long currentMemberId) {
        Member from = memberRepository.findById(currentMemberId)
                .orElseThrow(() -> new IllegalArgumentException("로그인한 회원을 찾을 수 없습니다."));
        Member to = memberRepository.findByLoginId(targetLoginId)
                .orElseThrow(() -> new IllegalArgumentException("언팔로우 대상 회원을 찾을 수 없습니다."));

        followRepository.findByFromMemberAndToMember(from, to)
                .ifPresentOrElse(followRepository::delete, () -> {
                    throw new IllegalStateException("팔로우 관계가 존재하지 않습니다.");
                });
    }

    @Transactional(readOnly = true)
    public List<FollowMemberResponse> getFollowers(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        return followRepository.findAllByToMember(member).stream()
                .map(follow -> FollowMemberResponse.from(follow.getFromMember()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowMemberResponse> getFollowings(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        return followRepository.findAllByFromMember(member).stream()
                .map(follow -> FollowMemberResponse.from(follow.getToMember()))
                .toList();
    }
}
