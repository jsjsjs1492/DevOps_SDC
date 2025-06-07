package com.letsgo.devcommunity.domain.post.service;

import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.member.repository.MemberRepository;
import com.letsgo.devcommunity.domain.post.dto.*;
import com.letsgo.devcommunity.domain.post.entity.*;
import com.letsgo.devcommunity.domain.post.repository.*;

import com.letsgo.devcommunity.global.util.SessionUtils;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final MemberRepository memberRepository;
    private final TagRepository tagRepository;
    private final TagPostMapRepository tagPostMapRepository;
    private final HttpSession httpSession;

    @Autowired
    public PostService(PostRepository postRepository, CommentRepository commentRepository, PostLikeRepository postLikeRepository, MemberRepository memberRepository, TagPostMapRepository tagPostMapRepository, TagRepository tagRepository, HttpSession httpSession) {
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.tagRepository = tagRepository;
        this.tagPostMapRepository = tagPostMapRepository;
        this.httpSession = httpSession;
    }

    public CreateResponseDto createPost(UpdateDto updateDto) {
        Member loginMember = SessionUtils.getLoginMember(httpSession);
        Post post = new Post();
        post.setTitle(updateDto.getTitle());
        post.setContent(updateDto.getContent());
        post.setUserId(loginMember.getId());
        postRepository.save(post);

        updateDto.getTags().forEach(tagName -> {
            Optional<Tag> existingTag = tagRepository.findByTagName(tagName);
            if (existingTag.isEmpty()) {
                Tag newTag = new Tag(tagName);
                tagRepository.save(newTag);
            }
            Optional<Tag> temp = tagRepository.findByTagName(tagName);
            TagPostMap tagPostMap = new TagPostMap(temp.get().getTagId(), post.getId());
            tagPostMapRepository.save(tagPostMap);
        });

        return new CreateResponseDto(post.getId(), post.getCreatedAt());
    }

    // 게시글 id
    public Post findById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 없습니다."));
    }

    public PostListDto findAll(Integer page, Integer size, String sort) {
        String[] sortParams = sort.split(",");
        String sortBy = sortParams[0];
        Sort.Direction direction = Sort.Direction.fromString(sortParams[1]);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<Post> postPage = postRepository.findAll(pageable);

        List<ContentDto> contentList = postPage.getContent().stream()
                .map(post -> {
                    int likeCount = postLikeRepository.countByPostId(post.getId());
                    int commentCount = commentRepository.countByPostId(post.getId());
                    Optional<Member> user = memberRepository.findById(post.getUserId());
                    String nickname = user.map(Member::getNickname)
                            .orElse(null);
                    AuthorDTO authorDTO = new AuthorDTO(post.getUserId(), nickname);
                    return ContentDto.fromEntity(post, likeCount, commentCount, authorDTO);
                })
                .collect(Collectors.toList());

        return new PostListDto(
                postPage.getTotalPages(),
                (int) postPage.getTotalElements(),
                postPage.getNumber(),
                postPage.getSize(),
                contentList
        );
    }

    public UpdateResponseDto updatePost(Long id, UpdateDto updateDto) {
        Post post = findById(id);
        post.setTitle(updateDto.getTitle());
        post.setContent(updateDto.getContent());
        postRepository.save(post);
        return new UpdateResponseDto(post.getId(), post.getUpdatedAt());
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }

    public CreateResponseDto createComment(Long postId, CreateCommentDto content) {
        Comment comment = new Comment();
        comment.setContent(content.getContent());
        comment.setPostId(postId);
        Member loginMember = SessionUtils.getLoginMember(httpSession);
        comment.setUserId(loginMember.getId());
        commentRepository.save(comment);
        return new CreateResponseDto(comment.getId(), comment.getCreated_at());
    }

    public void deleteComment(Long id) {
        commentRepository.deleteById(id);
    }

    public void createPostLike(Long postId) {
        Member loginMember = SessionUtils.getLoginMember(httpSession);
        if (postRepository.findById(postId).isPresent()) {
            final var like = postLikeRepository.findByPostIdAndUserId(postId, loginMember.getId());
            if(like.isEmpty()){
                postLikeRepository.save(new PostLike(loginMember.getId(), postId));
                Post post = postRepository.findById(postId).get();
                Integer likeCounts = post.getLikeCounts();
                post.setLikeCounts(likeCounts + 1);
                postRepository.save(post);
            }
        }
    }

    public void deletePostLike(Long postId) {
        Member loginMember = SessionUtils.getLoginMember(httpSession);
        if (postRepository.findById(postId).isPresent()) {
            final var star = postLikeRepository.findByPostIdAndUserId(postId, loginMember.getId());
            if(star.isPresent()){
                postLikeRepository.deleteByPostIdAndUserId(postId, loginMember.getId());
                Post post = postRepository.findById(postId).get();
                Integer likeCounts = post.getLikeCounts();
                post.setLikeCounts(likeCounts - 1);
                postRepository.save(post);
            }
        }
    }

    public List<Post> getUserPosts(Long userId){
        return postRepository.findAllByUserId(userId);
    }

    public List<Post> getUserPostLike(Long userId){
        List<PostLike> likeList = postLikeRepository.findAllByUserId(userId);
        if(!likeList.isEmpty()){
            List<Long> postIds = likeList.stream().map(PostLike::getPostId).toList();
            return postRepository.findAllByIdIn(postIds);
        }
        return new ArrayList<>();
    }

    public PostDto getOnePost(Long postId) {
        Optional<Post> post = postRepository.findById(postId);
        if (post.isEmpty()){
            throw new IllegalArgumentException("post not found");
        }
        Long userId = post.get().getUserId();
        Optional<Member> member = memberRepository.findById(userId); // Post 작성자
        if(member.isEmpty()){
            throw new IllegalArgumentException("member not found");
        }
        AuthorDTO authorDTO = new AuthorDTO(member.get().getId(), member.get().getNickname());
        List<Comment> comments = commentRepository.findAllByPostId(postId);
        List<CommentDto> commentDtos = new ArrayList<>();
        comments.forEach(comment -> {
            Optional<Member> member1 = memberRepository.findById(comment.getUserId());
            if(member1.isEmpty()){
                throw new IllegalArgumentException("member not found");
            }
            String author = member1.get().getNickname(); // 댓글 작성자
            CommentDto commentDto = new CommentDto(comment.getId(), author, comment.getContent(), comment.getCreated_at());
            commentDtos.add(commentDto);
        });
        Integer likeCount = postLikeRepository.countByPostId(postId);
        Member loginMember = SessionUtils.getLoginMember(httpSession);
        Long loginMemberId = loginMember.getId();
        Optional<PostLike> postLike = postLikeRepository.findByPostIdAndUserId(postId, loginMemberId);
        Boolean isLiked = postLike.isPresent();
        return new PostDto(post.get(), authorDTO, likeCount, isLiked, commentDtos);
    }

    public PostListDto search(String query, Pageable pageable) {
        Page<Post> postPage = postRepository.findByTitleContainingOrContentContaining(query, query, pageable);
        List<ContentDto> contentList = postPage.getContent().stream()
                .map(post -> {
                    int likeCount = postLikeRepository.countByPostId(post.getId());
                    int commentCount = commentRepository.countByPostId(post.getId());
                    Optional<Member> user = memberRepository.findById(post.getUserId());
                    String nickname = user.map(Member::getNickname)
                            .orElse(null);
                    AuthorDTO authorDTO = new AuthorDTO(post.getUserId(), nickname);
                    return ContentDto.fromEntity(post, likeCount, commentCount, authorDTO);
                })
                .collect(Collectors.toList());

        return new PostListDto(
                postPage.getTotalPages(),
                (int) postPage.getTotalElements(),
                postPage.getNumber(),
                postPage.getSize(),
                contentList
        );
    }

    public PostListDto tagSearch(String query, Pageable pageable){
        final var tag = tagRepository.findByTagName(query);
        if (tag.isEmpty()) {
            throw new IllegalArgumentException("tag not found");
        }

        final var tagPostMapList = tagPostMapRepository.findAllByTagId(tag.get().getTagId());

        List<Long> postIds = tagPostMapList.stream()
                .map(TagPostMap::getPostId)
                .collect(Collectors.toList());

        if (postIds.isEmpty()) {
            return new PostListDto(0, 0, pageable.getPageNumber(), pageable.getPageSize(), Collections.emptyList());
        }

        Page<Post> postPage = postRepository.findByIdIn(postIds, pageable);

        List<ContentDto> contentDtos = postPage.getContent().stream()
                .map(post -> {
                    // 여기서 각각의 post에 대해 추가 정보 조회
                    int likeCount = postLikeRepository.countByPostId(post.getId());
                    int commentCount = commentRepository.countByPostId(post.getId());
                    Optional<Member> user = memberRepository.findById(post.getUserId());
                    String nickname = user.map(Member::getNickname)
                            .orElse(null);
                    AuthorDTO authorDTO = new AuthorDTO(post.getUserId(), nickname);

                    return ContentDto.fromEntity(post, likeCount, commentCount, authorDTO);
                })
                .collect(Collectors.toList());

        return new PostListDto(
                postPage.getTotalPages(),
                (int) postPage.getTotalElements(),
                postPage.getNumber(),
                postPage.getSize(),
                contentDtos
        );
    }
}
