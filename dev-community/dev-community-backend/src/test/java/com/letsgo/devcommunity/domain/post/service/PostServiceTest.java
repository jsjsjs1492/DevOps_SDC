package com.letsgo.devcommunity.domain.post.service;

import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.post.dto.*;
import com.letsgo.devcommunity.domain.post.entity.Comment;
import com.letsgo.devcommunity.domain.post.entity.Post;
import com.letsgo.devcommunity.domain.post.repository.*;
import com.letsgo.devcommunity.domain.member.repository.MemberRepository;
import com.letsgo.devcommunity.domain.post.entity.PostLike;
import com.letsgo.devcommunity.global.util.SessionUtils;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThatThrownBy;


import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private PostLikeRepository postLikeRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private TagRepository tagRepository;
    @Mock private TagPostMapRepository tagPostMapRepository;
    @Mock private HttpSession httpSession;

    private PostService postService;

    @BeforeEach
    void setUp() {
        postService = new PostService(
                postRepository,
                commentRepository,
                postLikeRepository,
                memberRepository,
                tagPostMapRepository,
                tagRepository,
                httpSession
        );
    }

    @Test
    void 게시물_생성하기() {
        // given
        UpdateDto updateDto = new UpdateDto();
        updateDto.setTitle("Test Title");
        updateDto.setContent("Test Content");

        Member mockMember = new Member("1", "test@test.com", "pw123", "nickname123", "None");
        mockMember.setId(123L);

        Post savedPost = new Post();
        savedPost.setId(1L);
        savedPost.setCreatedAt(LocalDateTime.now());

        try (MockedStatic<SessionUtils> mockedStatic = mockStatic(SessionUtils.class)) {
            mockedStatic.when(() -> SessionUtils.getLoginMember(httpSession))
                    .thenReturn(mockMember);

            when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
                Post post = invocation.getArgument(0);
                post.setId(1L);
                post.setCreatedAt(savedPost.getCreatedAt());
                return post;
            });

            // when
            CreateResponseDto response = postService.createPost(updateDto);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getCreatedAt()).isEqualTo(savedPost.getCreatedAt());

            verify(postRepository, times(1)).save(any(Post.class));
        }
    }

    @Test
    void 게시글_조회_성공() {
        // given
        Long postId = 1L;
        Post mockPost = new Post();
        mockPost.setId(postId);
        mockPost.setTitle("테스트 제목");

        when(postRepository.findById(postId)).thenReturn(Optional.of(mockPost));

        // when
        Post result = postService.findById(postId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(postId);
        assertThat(result.getTitle()).isEqualTo("테스트 제목");

        verify(postRepository, times(1)).findById(postId);
    }

    @Test
    void 게시글_조회_실패_예외발생() {
        // given
        Long postId = 99L;
        when(postRepository.findById(postId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> postService.findById(postId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("게시글이 없습니다.");

        verify(postRepository, times(1)).findById(postId);
    }

    @Test
    void 검색_시_게시물_리스트_반환_여부() {
        // given
        String query = "test";
        Pageable pageable = PageRequest.of(0, 10);

        Post mockPost = new Post();
        mockPost.setId(1L);
        mockPost.setTitle("test title");
        mockPost.setContent("test content");
        mockPost.setUserId(100L);
        mockPost.setCreatedAt(LocalDateTime.now());

        List<Post> mockPosts = List.of(mockPost);
        Page<Post> mockPage = new PageImpl<>(mockPosts, pageable, 1);

        when(postRepository.findByTitleContainingOrContentContaining(query, query, pageable))
                .thenReturn(mockPage);

        when(postLikeRepository.countByPostId(1L)).thenReturn(5);
        when(commentRepository.countByPostId(1L)).thenReturn(3);

        Member mockMember = new Member("1", "test@test.com", "pw123", "nickname123", "None");
        mockMember.setId(100L);
        mockMember.setNickname("nickname");

        when(memberRepository.findById(100L)).thenReturn(Optional.of(mockMember));

        // when
        PostListDto result = postService.search(query, pageable);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);

        ContentDto content = result.getContent().get(0);
        assertThat(content.getLikeCount()).isEqualTo(5);
        assertThat(content.getCommentCount()).isEqualTo(3);
        assertThat(content.getAuthor().getId()).isEqualTo(100L);
        assertThat(content.getAuthor().getNickname()).isEqualTo("nickname");

        // verify repository interactions
        verify(postRepository).findByTitleContainingOrContentContaining(query, query, pageable);
        verify(postLikeRepository).countByPostId(1L);
        verify(commentRepository).countByPostId(1L);
        verify(memberRepository).findById(100L);
    }

    @Test
    void 게시글_전체_조회_성공() {
        // given
        int page = 0;
        int size = 10;
        String sort = "createdAt,desc";

        // Mock post
        Post post = new Post();
        post.setId(1L);
        post.setTitle("테스트 제목");
        post.setContent("본문");
        post.setUserId(1L);

        List<Post> postList = List.of(post);
        Page<Post> mockPage = new PageImpl<>(postList, PageRequest.of(page, size), 1);

        when(postRepository.findAll(any(Pageable.class))).thenReturn(mockPage);
        when(postLikeRepository.countByPostId(1L)).thenReturn(5);
        when(commentRepository.countByPostId(1L)).thenReturn(3);

        Member member = new Member("1", "test@test.com", "pw123", "nickname123", "None");
        member.setId(1L);
        member.setNickname("닉네임");

        when(memberRepository.findById(1L)).thenReturn(Optional.of(member));

        // when
        PostListDto result = postService.findAll(page, size, sort);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().getTitle()).isEqualTo("테스트 제목");
        assertThat(result.getContent().getFirst().getLikeCount()).isEqualTo(5);
        assertThat(result.getContent().getFirst().getCommentCount()).isEqualTo(3);
        assertThat(result.getContent().getFirst().getAuthor().getNickname()).isEqualTo("닉네임");

        verify(postRepository, times(1)).findAll(any(Pageable.class));
        verify(postLikeRepository).countByPostId(1L);
        verify(commentRepository).countByPostId(1L);
        verify(memberRepository).findById(1L);
    }

    @Test
    void 게시물_수정_성공() {
        // given
        Long postId = 1L;
        UpdateDto updateDto = new UpdateDto();
        updateDto.setTitle("수정된 제목");
        updateDto.setContent("수정된 본문");

        Post post = new Post();
        post.setId(postId);
        post.setTitle("이전 제목");
        post.setContent("이전 본문");
        post.setUpdatedAt(LocalDateTime.now());

        // findById(id) → post
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        // save(post) → 저장 동작 흉내 (변경 사항 반영)
        when(postRepository.save(any(Post.class))).thenReturn(post);

        // when
        UpdateResponseDto response = postService.updatePost(postId, updateDto);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(postId);
        assertThat(response.getUpdatedAt()).isEqualTo(post.getUpdatedAt());

        verify(postRepository).findById(postId);
        verify(postRepository).save(post);

        // 수정 내용 반영 검증
        assertThat(post.getTitle()).isEqualTo("수정된 제목");
        assertThat(post.getContent()).isEqualTo("수정된 본문");
    }

    @Test
    void 게시물_하나_가져오기() {
        // given
        Long postId = 1L;
        Long authorId = 100L;
        Long commentAuthorId = 200L;

        // 게시글
        Post post = new Post();
        post.setId(postId);
        post.setTitle("Test title");
        post.setContent("Test content");
        post.setUserId(authorId);
        post.setCreatedAt(LocalDateTime.now());

        // 게시글 작성자
        Member author = new Member("1", "test@test.com", "pw123", "AuthorNick", "None");
        author.setId(authorId);

        // 댓글
        Comment comment = new Comment();
        comment.setId(10L);
        comment.setContent("Great post");
        comment.setUserId(commentAuthorId);
        comment.setPostId(postId);
        comment.setCreated_at(LocalDateTime.now());

        // 댓글 작성자
        Member commentAuthor = new Member("2", "test@test.com", "pw123", "Commenter", "None");
        commentAuthor.setId(commentAuthorId);

        // 로그인 사용자
        Member loginMember = new Member("3", "test@test.com", "pw123", "nickname123", "None");
        loginMember.setId(999L);

        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(memberRepository.findById(authorId)).thenReturn(Optional.of(author));
        when(commentRepository.findAllByPostId(postId)).thenReturn(List.of(comment));
        when(memberRepository.findById(commentAuthorId)).thenReturn(Optional.of(commentAuthor));
        when(postLikeRepository.countByPostId(postId)).thenReturn(3);
        when(postLikeRepository.findByPostIdAndUserId(postId, loginMember.getId())).thenReturn(Optional.of(new PostLike()));

        try (MockedStatic<SessionUtils> mockedStatic = mockStatic(SessionUtils.class)) {
            mockedStatic.when(() -> SessionUtils.getLoginMember(httpSession)).thenReturn(loginMember);

            // when
            PostDto result = postService.getOnePost(postId);

            // then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(postId);
            assertThat(result.getAuthor().getNickname()).isEqualTo("AuthorNick");
            assertThat(result.getLikeCount()).isEqualTo(3);
            assertThat(result.getIsLiked()).isTrue();
            assertThat(result.getComments()).hasSize(1);
            assertThat(result.getComments().get(0).getAuthor()).isEqualTo("Commenter");

            // verify repository interactions
            verify(postRepository).findById(postId);
            verify(commentRepository).findAllByPostId(postId);
            verify(memberRepository).findById(authorId);
            verify(memberRepository).findById(commentAuthorId);
            verify(postLikeRepository).countByPostId(postId);
            verify(postLikeRepository).findByPostIdAndUserId(postId, loginMember.getId());
        }
    }

    @Test
    void 댓글_생성_성공() {
        // given
        Long postId = 1L;

        CreateCommentDto commentDto = new CreateCommentDto();
        commentDto.setContent("댓글 내용");

        // 사용자 정의 생성자 사용
        Member member = new Member("1", "test@test.com", "pw123", "nickname123", "None");
        member.setId(123L);  // ID는 따로 지정해야 할 수도 있음

        Comment savedComment = new Comment();
        savedComment.setId(99L);
        savedComment.setPostId(postId);
        savedComment.setContent("댓글 내용");
        savedComment.setUserId(member.getId());
        savedComment.setCreated_at(LocalDateTime.now());

        try (MockedStatic<SessionUtils> mockedStatic = mockStatic(SessionUtils.class)) {
            mockedStatic.when(() -> SessionUtils.getLoginMember(httpSession))
                    .thenReturn(member);

            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment comment = invocation.getArgument(0);
                comment.setId(savedComment.getId());
                comment.setCreated_at(savedComment.getCreated_at());
                return comment;
            });

            // when
            CreateResponseDto response = postService.createComment(postId, commentDto);

            // then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(savedComment.getId());
            assertThat(response.getCreatedAt()).isEqualTo(savedComment.getCreated_at());

            verify(commentRepository).save(any(Comment.class));
        }
    }

    @Test
    void 게시글_좋아요_성공() {
        // given
        Long postId = 1L;

        Member member = new Member("1", "test@test.com", "pw123", "nickname123", "None");
        member.setId(123L);

        Post post = new Post();
        post.setId(postId);
        post.setUserId(member.getId());
        post.setLikeCounts(0);

        try (MockedStatic<SessionUtils> mockedStatic = mockStatic(SessionUtils.class)) {
            mockedStatic.when(() -> SessionUtils.getLoginMember(httpSession))
                    .thenReturn(member);

            when(postRepository.findById(postId)).thenReturn(Optional.of(post)); // 호출 1
            when(postLikeRepository.findByPostIdAndUserId(postId, member.getId()))
                    .thenReturn(Optional.empty());

            // when
            postService.createPostLike(postId);

            // then
            verify(postLikeRepository).save(any(PostLike.class));
            verify(postRepository, times(2)).findById(postId); // 한 번은 존재 확인용, 한 번은 좋아요 수 증가용
            verify(postRepository).save(post);

            assertThat(post.getLikeCounts()).isEqualTo(1);
        }
    }

    @Test
    void 특정_유저_좋아요한_게시물_가져오기_성공() {
        // given
        Long userId = 1L;

        PostLike like1 = new PostLike();
        like1.setPostId(101L);

        PostLike like2 = new PostLike();
        like2.setPostId(102L);

        List<PostLike> likeList = List.of(like1, like2);

        Post post1 = new Post();
        post1.setId(101L);
        post1.setTitle("Post 101");

        Post post2 = new Post();
        post2.setId(102L);
        post2.setTitle("Post 102");

        List<Post> expectedPosts = List.of(post1, post2);

        when(postLikeRepository.findAllByUserId(userId)).thenReturn(likeList);
        when(postRepository.findAllByIdIn(List.of(101L, 102L))).thenReturn(expectedPosts);

        // when
        List<Post> result = postService.getUserPostLike(userId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(101L);
        assertThat(result.get(1).getId()).isEqualTo(102L);

        verify(postLikeRepository).findAllByUserId(userId);
        verify(postRepository).findAllByIdIn(List.of(101L, 102L));
    }

    @Test
    void 좋아요_안했을때_아무것도_안가져오는지() {
        // given
        Long userId = 2L;
        when(postLikeRepository.findAllByUserId(userId)).thenReturn(List.of());

        // when
        List<Post> result = postService.getUserPostLike(userId);

        // then
        assertThat(result).isEmpty();
        verify(postLikeRepository).findAllByUserId(userId);
        verify(postRepository, never()).findAllByIdIn(any());
    }
}
