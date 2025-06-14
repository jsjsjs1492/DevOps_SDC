package com.letsgo.devcommunity.domain.member.service;

import com.letsgo.devcommunity.domain.member.dto.FollowMemberResponse;
import com.letsgo.devcommunity.domain.member.dto.MemberProfileResponse;
import com.letsgo.devcommunity.domain.member.dto.PasswordUpdateRequestDto;
import com.letsgo.devcommunity.domain.member.entity.Follow;
import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.member.repository.FollowRepository;
import com.letsgo.devcommunity.domain.member.repository.MemberRepository;
import com.letsgo.devcommunity.domain.post.repository.PostLikeRepository;
import com.letsgo.devcommunity.global.common.FileStorageService;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.letsgo.devcommunity.domain.member.constants.MemberErrorMessages.*;
import static com.letsgo.devcommunity.domain.member.service.MemberService.*;
import static com.letsgo.devcommunity.global.common.FileStorageService.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private MemberService memberService;

    @Test
    @DisplayName("프로필 조회 성공")
    void getProfile_Success() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        String loginId = member.getLoginId();
        int followerCount = 10;
        int followingCount = 5;
        long receivedLikeCount = 20L;

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.of(member));
        when(followRepository.countByToMember(member)).thenReturn(followerCount);
        when(followRepository.countByFromMember(member)).thenReturn(followingCount);
        when(postLikeRepository.countLikesReceivedByMember(member.getId())).thenReturn(receivedLikeCount);

        // when
        MemberProfileResponse profileResponse = memberService.getProfile(loginId);

        // then
        assertThat(profileResponse).isNotNull();
        assertThat(profileResponse.nickname()).isEqualTo(member.getNickname());
        assertThat(profileResponse.profileImageUrl()).isEqualTo(member.getProfileImageUrl());
        assertThat(profileResponse.followerCount()).isEqualTo(followerCount);
        assertThat(profileResponse.followingCount()).isEqualTo(followingCount);
        assertThat(profileResponse.receivedLikeCount()).isEqualTo(receivedLikeCount);

        verify(memberRepository).findByLoginId(loginId);
        verify(followRepository).countByToMember(member);
        verify(followRepository).countByFromMember(member);
        verify(postLikeRepository).countLikesReceivedByMember(member.getId());
    }

    @Test
    @DisplayName("프로필 조회 실패: 사용자를 찾을 수 없음")
    void getProfile_Failure_MemberNotFound() {
        // given
        String loginId = "nonExistentUser";
        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.empty());

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.getProfile(loginId)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo(NOT_FOUND_MEMBER);
        verify(memberRepository).findByLoginId(loginId);
        verify(followRepository, never()).countByToMember(any(Member.class));
        verify(followRepository, never()).countByFromMember(any(Member.class));
        verify(postLikeRepository, never()).countLikesReceivedByMember(anyLong());
    }


    @Test
    @DisplayName("팔로우 성공")
    void follow_Success() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member followTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(followTarget.getLoginId())).thenReturn(Optional.of(followTarget));
        when(followRepository.existsByFromMemberAndToMember(me, followTarget)).thenReturn(false);

        // when
        assertDoesNotThrow(() -> memberService.follow(followTarget.getLoginId(), me.getId()));

        // then
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(followTarget.getLoginId());
        verify(followRepository).existsByFromMemberAndToMember(me, followTarget);

        ArgumentCaptor<Follow> followCaptor = ArgumentCaptor.forClass(Follow.class);
        verify(followRepository).save(followCaptor.capture());

        Follow capturedFollow = followCaptor.getValue();
        assertThat(capturedFollow.getFromMember()).isEqualTo(me);
        assertThat(capturedFollow.getToMember()).isEqualTo(followTarget);
    }

    @Test
    @DisplayName("팔로우 실패: 본인 조회 실패")
    void follow_Failure_CannotFindMe() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member followTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.follow(followTarget.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FIND_ME);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository, never()).findByLoginId(followTarget.getLoginId());
        verify(followRepository, never()).existsByFromMemberAndToMember(me, followTarget);
        verify(followRepository, never()).save(any(Follow.class));
    }

    @Test
    @DisplayName("팔로우 실패: 팔로우 대상 조회 실패")
    void follow_Failure_CannotFindFollowTarget() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member followTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(followTarget.getLoginId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.follow(followTarget.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FIND_FOLLOW_TARGET);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(followTarget.getLoginId());
        verify(followRepository, never()).existsByFromMemberAndToMember(me, followTarget);
        verify(followRepository, never()).save(any(Follow.class));
    }

    @Test
    @DisplayName("팔로우 실패: 이미 팔로우 중")
    void follow_Failure_AlreadyFollowing() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member followTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(followTarget.getLoginId())).thenReturn(Optional.of(followTarget));
        when(followRepository.existsByFromMemberAndToMember(me, followTarget)).thenReturn(true);

        // when
        IllegalStateException illegalStateException = assertThrows(
                IllegalStateException.class,
                () -> memberService.follow(followTarget.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalStateException.getMessage()).isEqualTo(ALREADY_FOLLOWING);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(followTarget.getLoginId());
        verify(followRepository).existsByFromMemberAndToMember(me, followTarget);
        verify(followRepository, never()).save(any(Follow.class));
    }

    @Test
    @DisplayName("팔로우 실패: 본인을 팔로우")
    void follow_Failure_SelfFollow() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member followTarget = me;
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(followTarget.getLoginId())).thenReturn(Optional.of(me));
        when(followRepository.existsByFromMemberAndToMember(me, followTarget)).thenReturn(false);

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.follow(me.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FOLLOW_MYSELF);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(followTarget.getLoginId());
        verify(followRepository).existsByFromMemberAndToMember(me, followTarget);
        verify(followRepository, never()).save(any(Follow.class));
    }

    @Test
    @DisplayName("팔로우 실패: 팔로우 대상 ID null 또는 빈 문자열")
    void follow_Failure_NullOrEmptyTargetId() {
        // given
        Member me = TestDataFactory.createDefaultMember();

        // when
        IllegalArgumentException nullTargetIdException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.follow(null, me.getId())
        );

        IllegalArgumentException emptyTargetIdException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.follow("", me.getId())
        );

        // then
        assertThat(nullTargetIdException.getMessage()).isEqualTo(TARGET_ID_NULL_OR_EMPTY);
        assertThat(emptyTargetIdException.getMessage()).isEqualTo(TARGET_ID_NULL_OR_EMPTY);

        verify(memberRepository, never()).findById(anyLong());
        verify(memberRepository, never()).findByLoginId(anyString());
        verify(followRepository, never()).existsByFromMemberAndToMember(any(Member.class), any(Member.class));
        verify(followRepository, never()).save(any(Follow.class));
    }

    @Test
    @DisplayName("언팔로우 성공")
    void unfollow_Success() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member unfollowTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(unfollowTarget.getLoginId())).thenReturn(Optional.of(unfollowTarget));
        Follow followRelationship = new Follow(me, unfollowTarget);
        when(followRepository.findByFromMemberAndToMember(me, unfollowTarget)).thenReturn(Optional.of(followRelationship));

        // when
        assertDoesNotThrow(() -> memberService.unfollow(unfollowTarget.getLoginId(), me.getId()));

        // then
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(unfollowTarget.getLoginId());
        verify(followRepository).findByFromMemberAndToMember(me, unfollowTarget);
        verify(followRepository).delete(followRelationship);
    }

    @Test
    @DisplayName("언팔로우 실패: 본인 조회 실패")
    void unfollow_Failure_CannotFindMe() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member unfollowTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.unfollow(unfollowTarget.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FIND_ME);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository, never()).findByLoginId(unfollowTarget.getLoginId());
        verify(followRepository, never()).findByFromMemberAndToMember(me, unfollowTarget);
        verify(followRepository, never()).delete(any(Follow.class));
    }

    @Test
    @DisplayName("언팔로우 실패: 언팔로우 대상 조회 실패")
    void unfollow_Failure_CannotFindUnfollowTarget() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member unfollowTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(unfollowTarget.getLoginId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.unfollow(unfollowTarget.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FIND_UNFOLLOW_TARGET);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(unfollowTarget.getLoginId());
        verify(followRepository, never()).findByFromMemberAndToMember(me, unfollowTarget);
        verify(followRepository, never()).delete(any(Follow.class));
    }

    @Test
    @DisplayName("언팔로우 실패: 팔로우 관계 없음")
    void unfollow_Failure_CannotFindFollowRelationship() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member unfollowTarget = TestDataFactory.createMember(
                "targetLoginId",
                "targetEmail@example.com",
                "encodedPassword",
                "targetNickname"
        );
        when(memberRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(memberRepository.findByLoginId(unfollowTarget.getLoginId())).thenReturn(Optional.of(unfollowTarget));
        when(followRepository.findByFromMemberAndToMember(me, unfollowTarget)).thenReturn(Optional.empty());

        // when
        IllegalStateException illegalStateException = assertThrows(
                IllegalStateException.class,
                () -> memberService.unfollow(unfollowTarget.getLoginId(), me.getId())
        );

        // then
        assertThat(illegalStateException.getMessage()).isEqualTo(CANNOT_FIND_FOLLOW_RELATIONSHIP);
        verify(memberRepository).findById(me.getId());
        verify(memberRepository).findByLoginId(unfollowTarget.getLoginId());
        verify(followRepository).findByFromMemberAndToMember(me, unfollowTarget);
        verify(followRepository, never()).delete(any(Follow.class));
    }

    @Test
    @DisplayName("언팔로우 실패: 언팔로우 대상 ID null 또는 빈 문자열")
    void unfollow_Failure_NullOrEmptyTargetId() {
        // given
        Member me = TestDataFactory.createDefaultMember();

        // when
        IllegalArgumentException nullTargetIdException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.unfollow(null, me.getId())
        );

        IllegalArgumentException emptyTargetIdException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.unfollow("", me.getId())
        );

        // then
        assertThat(nullTargetIdException.getMessage()).isEqualTo(TARGET_ID_NULL_OR_EMPTY);
        assertThat(emptyTargetIdException.getMessage()).isEqualTo(TARGET_ID_NULL_OR_EMPTY);

        verify(memberRepository, never()).findById(anyLong());
        verify(memberRepository, never()).findByLoginId(anyString());
        verify(followRepository, never()).findByFromMemberAndToMember(any(Member.class), any(Member.class));
        verify(followRepository, never()).delete(any(Follow.class));
    }

    @Test
    @DisplayName("팔로워 목록 조회 성공")
    void getFollowers_Success() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member follower1 = TestDataFactory.createMember(
                "followerId1",
                "followerEmail1@example.com",
                "encodedPassword1",
                "follower1Nickname"
        );
        Member follower2 = TestDataFactory.createMember(
                "followerId2",
                "followerEmail2@example.com",
                "encodedPassword2",
                "follower2Nickname"
        );
        Follow follow1 = new Follow(follower1, me);
        Follow follow2 = new Follow(follower2, me);

        when(memberRepository.findByLoginId(me.getLoginId())).thenReturn(Optional.of(me));
        when(followRepository.findAllByToMember(me)).thenReturn(List.of(follow1, follow2));

        // when
        List<FollowMemberResponse> followers = memberService.getFollowers(me.getLoginId());

        // then
        verify(memberRepository).findByLoginId(me.getLoginId());
        verify(followRepository).findAllByToMember(me);
        assertThat(followers).hasSize(2);
        assertThat(followers.get(0).loginId()).isEqualTo(follower1.getLoginId());
        assertThat(followers.get(1).loginId()).isEqualTo(follower2.getLoginId());
        assertThat(followers.get(0).nickname()).isEqualTo(follower1.getNickname());
        assertThat(followers.get(1).nickname()).isEqualTo(follower2.getNickname());
    }

    @Test
    @DisplayName("팔로우 목록 조회 실패: 본인 조회 실패")
    void getFollowers_Failure_CannotFindMe() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        when(memberRepository.findByLoginId(me.getLoginId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.getFollowers(me.getLoginId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FIND_ME);
        verify(memberRepository).findByLoginId(me.getLoginId());
        verify(followRepository, never()).findAllByToMember(me);
    }

    @Test
    @DisplayName("대규모 팔로워 목록 조회")
    void getFollowers_LargeList() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        when(memberRepository.findByLoginId(me.getLoginId())).thenReturn(Optional.of(me));

        int size = 1000;
        List<Follow> followerList = TestDataFactory.createFollowerList(me, size);

        when(followRepository.findAllByToMember(me)).thenReturn(followerList);

        // when
        List<FollowMemberResponse> followers = memberService.getFollowers(me.getLoginId());

        // then
        verify(memberRepository).findByLoginId(me.getLoginId());
        verify(followRepository).findAllByToMember(me);
        assertThat(followers).hasSize(size);
        for (int i = 0; i < size; i++) {
            assertThat(followers.get(i).loginId()).isEqualTo(followerList.get(i).getFromMember().getLoginId());
            assertThat(followers.get(i).nickname()).isEqualTo(followerList.get(i).getFromMember().getNickname());
        }
    }

    @Test
    @DisplayName("팔로잉 목록 조회 성공")
    void getFollowings_Success() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        Member following1 = TestDataFactory.createMember(
                "followingId1",
                "followingEmail1@example.com",
                "encodedPassword1",
                "following1Nickname"
        );
        Member following2 = TestDataFactory.createMember(
                "followingId2",
                "followingEmail2@example.com",
                "encodedPassword2",
                "following2Nickname"
        );
        Follow follow1 = new Follow(me, following1);
        Follow follow2 = new Follow(me, following2);

        when(memberRepository.findByLoginId(me.getLoginId())).thenReturn(Optional.of(me));
        when(followRepository.findAllByFromMember(me)).thenReturn(List.of(follow1, follow2));

        // when
        List<FollowMemberResponse> followings = memberService.getFollowings(me.getLoginId());

        // then
        verify(memberRepository).findByLoginId(me.getLoginId());
        verify(followRepository).findAllByFromMember(me);
        assertThat(followings).hasSize(2);
        assertThat(followings.get(0).loginId()).isEqualTo(following1.getLoginId());
        assertThat(followings.get(1).loginId()).isEqualTo(following2.getLoginId());
        assertThat(followings.get(0).nickname()).isEqualTo(following1.getNickname());
        assertThat(followings.get(1).nickname()).isEqualTo(following2.getNickname());
    }

    @Test
    @DisplayName("팔로잉 목록 조회 실패: 본인 조회 실패")
    void getFollowings_Failure_CannotFindMe() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        when(memberRepository.findByLoginId(me.getLoginId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.getFollowings(me.getLoginId())
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(CANNOT_FIND_ME);
        verify(memberRepository).findByLoginId(me.getLoginId());
        verify(followRepository, never()).findAllByFromMember(me);
    }

    @Test
    @DisplayName("대규모 팔로잉 목록 조회")
    void getFollowings_LargeList() {
        // given
        Member me = TestDataFactory.createDefaultMember();
        when(memberRepository.findByLoginId(me.getLoginId())).thenReturn(Optional.of(me));

        int size = 1000;
        List<Follow> followingList = TestDataFactory.createFollowingList(me, size);

        when(followRepository.findAllByFromMember(me)).thenReturn(followingList);

        // when
        List<FollowMemberResponse> followings = memberService.getFollowings(me.getLoginId());

        // then
        verify(memberRepository).findByLoginId(me.getLoginId());
        verify(followRepository).findAllByFromMember(me);
        assertThat(followings).hasSize(size);
        for (int i = 0; i < size; i++) {
            assertThat(followings.get(i).loginId()).isEqualTo(followingList.get(i).getToMember().getLoginId());
            assertThat(followings.get(i).nickname()).isEqualTo(followingList.get(i).getToMember().getNickname());
        }
    }

    @Test
    @DisplayName("프로필 이미지 업데이트 성공 : 기존 이미지가 기본 이미지인 경우")
    void updateProfileImage_Success_OldImageIsDefault() throws IOException {
        Member member = TestDataFactory.createDefaultMember();
        member.setProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);

        MockMultipartFile newImageFile = new MockMultipartFile("file", "new_image.png", "image/png", "new image content".getBytes());
        String newImageUrl = "https://s3.bucket/profile-images/new_image.png";

        when(memberRepository.findByLoginId(member.getLoginId())).thenReturn(Optional.of(member));
        when(fileStorageService.uploadFile(newImageFile, "profile-images/")).thenReturn(newImageUrl);

        String resultUrl = memberService.updateProfileImage(member.getLoginId(), newImageFile);

        assertThat(resultUrl).isEqualTo(newImageUrl);
        verify(memberRepository).findByLoginId(member.getLoginId());
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(fileStorageService).uploadFile(newImageFile, "profile-images/");
        assertThat(member.getProfileImageUrl()).isEqualTo(newImageUrl);
        verify(memberRepository).save(member);
    }

    @Test
    @DisplayName("프로필 이미지 업데이트 성공: 기존 이미지가 기본 이미지가 아닌 경우")
    void updateProfileImage_Success_OldImageIsNotDefault() throws IOException {
        String loginId = "defaultLoginId";
        Member member = TestDataFactory.createDefaultMember();
        String oldImageUrl = "https://s3.bucket/profile-images/old_image.png";
        member.setProfileImageUrl(oldImageUrl);

        MockMultipartFile newImageFile = new MockMultipartFile("file", "new_image.png", "image/png", "new image content".getBytes());
        String newImageUrl = "https://s3.bucket/profile-images/new_image.png";

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.of(member));
        when(fileStorageService.uploadFile(newImageFile, "profile-images/")).thenReturn(newImageUrl);

        String resultUrl = memberService.updateProfileImage(loginId, newImageFile);

        assertThat(resultUrl).isEqualTo(newImageUrl);
        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService).deleteFile(oldImageUrl);
        verify(fileStorageService).uploadFile(newImageFile, "profile-images/");
        assertThat(member.getProfileImageUrl()).isEqualTo(newImageUrl);
        verify(memberRepository).save(member);
    }

    @Test
    @DisplayName("프로필 이미지 업데이트 실패: 파일이 null인 경우")
    void updateProfileImage_Failure_FileIsNull() throws IOException{
        String loginId = "defaultLoginId";
        MockMultipartFile nullFile = null;

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updateProfileImage(loginId, nullFile)
        );

        assertThat(exception.getMessage()).isEqualTo("파일이 비어있거나 존재하지 않습니다.");
        verify(memberRepository, never()).findByLoginId(anyString());
        verify(fileStorageService, never()).uploadFile(any(), anyString());
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("프로필 이미지 업데이트 실패: 파일이 비어있는 경우")
    void updateProfileImage_Failure_EmptyFile() throws IOException {
        String loginId = "defaultLoginId";
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updateProfileImage(loginId, emptyFile)
        );

        assertThat(exception.getMessage()).isEqualTo("파일이 비어있거나 존재하지 않습니다.");
        verify(memberRepository, never()).findByLoginId(anyString());
        verify(fileStorageService, never()).uploadFile(any(), anyString());
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("프로필 이미지 업데이트 실패: 사용자 조회 실패")
    void updateProfileImage_Failure_CannotFindUser() throws IOException {
        String loginId = "defaultLoginId";
        MockMultipartFile newImageFile = new MockMultipartFile("file", "new_image.png", "image/png", "new image content".getBytes());

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updateProfileImage(loginId, newImageFile)
        );

        assertThat(exception.getMessage()).isEqualTo(CANNOT_FIND_ME);
        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService, never()).uploadFile(any(), anyString());
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("프로필 이미지 삭제 성공")
    void deleteProfileImage_Success() throws IOException {
        String loginId = "defaultLoginId";
        Member member = TestDataFactory.createDefaultMember();
        String imageUrl = "https://s3.bucket/profile-images/image.png";
        String imagekey = "profile-images/image.png";
        member.setProfileImageUrl(imageUrl);

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.of(member));

        memberService.deleteProfileImage(loginId);

        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService).deleteFile(imagekey);
        assertThat(member.getProfileImageUrl()).isEqualTo(DEFAULT_PROFILE_IMAGE_URL);
        verify(memberRepository).save(member);
    }

    @Test
    @DisplayName("프로필 이미지 삭제 실패: 사용자 조회 실패")
    void deleteProfileImage_Failure_CannotFindUser() throws IOException {
        String loginId = "defaultLoginId";

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.deleteProfileImage(loginId)
        );

        assertThat(exception.getMessage()).isEqualTo(CANNOT_FIND_ME);
        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("프로필 이미지 삭제 실패: 프로필 이미지가 존재하지 않는 경우 (null)")
    void deleteProfileImage_Failure_ProfileImageIsNull() throws IOException{
        String loginId = "defaultLoginId";
        Member member = TestDataFactory.createDefaultMember();
        member.setProfileImageUrl(null);

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.of(member));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.deleteProfileImage(loginId)
        );

        assertThat(exception.getMessage()).isEqualTo("프로필 이미지가 존재하지 않습니다.");
        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("프로필 이미지 삭제 실패: 프로필 이미지가 존재하지 않는 경우 (empty)")
    void deleteProfileImage_Failure_ProfileImageIsEmpty() throws IOException {
        String loginId = "defaultLoginId";
        Member member = TestDataFactory.createDefaultMember();
        member.setProfileImageUrl("");

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.of(member));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.deleteProfileImage(loginId)
        );

        assertThat(exception.getMessage()).isEqualTo("프로필 이미지가 존재하지 않습니다.");
        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("프로필 이미지 삭제 실패: 기본 프로필 이미지는 삭제할 수 없음")
    void deleteProfileImage_Failure_DefaultProfileImage() throws IOException {
        String loginId = "defaultLoginId";
        Member member = TestDataFactory.createDefaultMember();
        member.setProfileImageUrl(DEFAULT_PROFILE_IMAGE_URL);

        when(memberRepository.findByLoginId(loginId)).thenReturn(Optional.of(member));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.deleteProfileImage(loginId)
        );

        assertThat(exception.getMessage()).isEqualTo("기본 프로필 이미지는 삭제할 수 없습니다.");
        verify(memberRepository).findByLoginId(loginId);
        verify(fileStorageService, never()).deleteFile(anyString());
        verify(memberRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("비밀번호 변경 성공")
    void updatePassword_Success() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        String originalEncodedPassword = member.getPassword();

        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newPasswordA1!");

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), originalEncodedPassword)).thenReturn(true);
        when(passwordEncoder.encode(requestDto.getNewPassword())).thenReturn("encodedNewPassword");

        // when
        assertDoesNotThrow(() -> memberService.updatePassword(member.getId(), requestDto));

        // then
        verify(memberRepository).findById(member.getId());
        verify(passwordEncoder).matches(requestDto.getCurrentPassword(), originalEncodedPassword);
        verify(passwordEncoder).encode(requestDto.getNewPassword());
        assertThat(member.getPassword()).isEqualTo("encodedNewPassword");
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 사용자 조회 실패")
    void updatePassword_Failure_MemberNotFound() {
        // given
        Long memberId = 1L;
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newPasswordA1!");

        when(memberRepository.findById(memberId)).thenReturn(Optional.empty());

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(memberId, requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo(NOT_FOUND_MEMBER);
        verify(memberRepository).findById(memberId);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 현재 비밀번호 불일치")
    void updatePassword_Failure_CurrentPasswordMismatch() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("wrongCurrentPassword");
        requestDto.setNewPassword("newPasswordA1!");

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("현재 비밀번호가 일치하지 않습니다.");
        verify(memberRepository).findById(member.getId());
        verify(passwordEncoder).matches(requestDto.getCurrentPassword(), member.getPassword());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 새 비밀번호가 너무 짧음")
    void updatePassword_Failure_InvalidNewPassword_TooShort() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newA1!"); // 6 chars

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(true);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
        verify(memberRepository).findById(member.getId());
        verify(passwordEncoder).matches(requestDto.getCurrentPassword(), member.getPassword());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 새 비밀번호가 너무 긺")
    void updatePassword_Failure_InvalidNewPassword_TooLong() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newPasswordA1!newPasswordA1!newPasswordA1!"); // 24 chars

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(true);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
        verify(memberRepository).findById(member.getId());
        verify(passwordEncoder).matches(requestDto.getCurrentPassword(), member.getPassword());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 새 비밀번호에 대문자 없음")
    void updatePassword_Failure_InvalidNewPassword_NoUpperCase() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newpassword1!");

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(true);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 새 비밀번호에 소문자 없음")
    void updatePassword_Failure_InvalidNewPassword_NoLowerCase() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("NEWPASSWORD1!");

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(true);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 새 비밀번호에 숫자 없음")
    void updatePassword_Failure_InvalidNewPassword_NoDigit() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newPasswordA!");

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(true);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    }

    @Test
    @DisplayName("비밀번호 변경 실패: 새 비밀번호에 특수문자 없음")
    void updatePassword_Failure_InvalidNewPassword_NoSpecialChar() {
        // given
        Member member = TestDataFactory.createDefaultMember();
        PasswordUpdateRequestDto requestDto = new PasswordUpdateRequestDto();
        requestDto.setCurrentPassword("currentPassword");
        requestDto.setNewPassword("newPasswordA1");

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(requestDto.getCurrentPassword(), member.getPassword())).thenReturn(true);

        // when
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> memberService.updatePassword(member.getId(), requestDto)
        );

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    }

}

class TestDataFactory {

    static Member createDefaultMember() {
        return new Member("defaultLoginId", "defaultEmail@example.com", "encodedPassword", "defaultNickname", null);
    }

    static Member createMember(String loginId, String email, String password, String nickname) {
        return new Member(loginId, email, password, nickname, null);
    }

    static List<Follow> createFollowerList(Member toMember, int size) {
        return IntStream.range(0, size)
                .mapToObj(i -> new Follow(
                        createMember("followerId" + i, "followerEmail" + i + "@example.com", "encodedPassword", "nickname" + i),
                        toMember))
                .collect(Collectors.toList());
    }

    static List<Follow> createFollowingList(Member fromMember, int size) {
        return IntStream.range(0, size)
                .mapToObj(i -> new Follow(
                        fromMember,
                        createMember("followingId" + i, "followingEmail" + i + "@example.com", "encodedPassword", "nickname" + i)
                        ))
                .collect(Collectors.toList());
    }
}