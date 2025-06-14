package com.letsgo.devcommunity.domain.member.service;

import com.letsgo.devcommunity.domain.member.dto.FollowMemberResponse;
import com.letsgo.devcommunity.domain.member.dto.MemberProfileResponse;
import com.letsgo.devcommunity.domain.member.dto.NicknameUpdateRequestDto;
import com.letsgo.devcommunity.domain.member.dto.PasswordUpdateRequestDto;
import com.letsgo.devcommunity.domain.member.entity.Follow;
import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.member.repository.FollowRepository;
import com.letsgo.devcommunity.domain.member.repository.MemberRepository;
import com.letsgo.devcommunity.domain.post.repository.PostLikeRepository;
import com.letsgo.devcommunity.global.common.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.List;

import static com.letsgo.devcommunity.domain.member.constants.MemberErrorMessages.*;
import static com.letsgo.devcommunity.global.common.FileStorageService.DEFAULT_PROFILE_IMAGE_URL;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final FollowRepository followRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final PostLikeRepository postLikeRepository;

    @Transactional
    public MemberProfileResponse getProfile(String loginId) {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(NOT_FOUND_MEMBER));
        int followerCount = followRepository.countByToMember(member);
        int followingCount = followRepository.countByFromMember(member);
        long receivedLikeCount = postLikeRepository.countLikesReceivedByMember(member.getId());

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

    @Transactional
    public void updateNickname(Long currentMemberId, NicknameUpdateRequestDto nicknameUpdateRequestDto) {
        Member member = memberRepository.findById(currentMemberId)
                .orElseThrow(() -> new IllegalArgumentException(NOT_FOUND_MEMBER));

        member.updateNickname(nicknameUpdateRequestDto.getNickname());
    }

    @Transactional
    public void updatePassword(Long currentMemberId, PasswordUpdateRequestDto passwordUpdateRequestDto) {
        Member member = memberRepository.findById(currentMemberId)
                .orElseThrow(() -> new IllegalArgumentException(NOT_FOUND_MEMBER));

        if (!passwordEncoder.matches(passwordUpdateRequestDto.getCurrentPassword(), member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        validatePassword(passwordUpdateRequestDto.getNewPassword());

        member.updatePassword(passwordEncoder.encode(passwordUpdateRequestDto.getNewPassword()));
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 20) {
            throw new IllegalArgumentException("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
        }
        boolean hasUpperCase = false;
        boolean hasLowerCase = false;
        boolean hasDigit = false;
        boolean hasSpecialChar = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpperCase = true;
            } else if (Character.isLowerCase(c)) {
                hasLowerCase = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (!Character.isLetterOrDigit(c)) {
                hasSpecialChar = true;
            }
        }

        if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
            throw new IllegalArgumentException("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
        }
    }

    @Transactional
    public String updateProfileImage(String loginId, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있거나 존재하지 않습니다.");
        }

        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }

        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_ME));

        String oldImageUrl = member.getProfileImageUrl();

        if (oldImageUrl != null && !oldImageUrl.isEmpty() && !oldImageUrl.equals(DEFAULT_PROFILE_IMAGE_URL)) {
            fileStorageService.deleteFile(oldImageUrl);
        }

        String imageUrl = fileStorageService.uploadFile(file, "profile-images/");
        member.setProfileImageUrl(imageUrl);

        memberRepository.save(member);
        return imageUrl;
    }

    @Transactional
    public void deleteProfileImage(String loginId) throws IOException {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException(CANNOT_FIND_ME));

        if (member.getProfileImageUrl() == null || member.getProfileImageUrl().isEmpty()) {
            throw new IllegalArgumentException("프로필 이미지가 존재하지 않습니다.");
        }

        if (member.getProfileImageUrl().equals(DEFAULT_PROFILE_IMAGE_URL)) {
            throw new IllegalArgumentException("기본 프로필 이미지는 삭제할 수 없습니다.");
        }

        String keyToDelete = extractKeyFromUrl(member.getProfileImageUrl());
        fileStorageService.deleteFile(keyToDelete);

        member.setProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);
        memberRepository.save(member);
    }

    private String extractKeyFromUrl(String url) {
        URI uri = URI.create(url);
        String fullPath = uri.getPath();
        if (fullPath.startsWith("/")) {
            fullPath = fullPath.substring(1);
        }
        return fullPath;
    }

}
