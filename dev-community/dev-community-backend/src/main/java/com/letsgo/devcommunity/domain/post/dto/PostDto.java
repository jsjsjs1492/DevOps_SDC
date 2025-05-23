package com.letsgo.devcommunity.domain.post.dto;

import com.letsgo.devcommunity.domain.post.entity.Post;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class PostDto {
    private Long id;
    private String title;
    private String content;
    private AuthorDTO author;
    private LocalDateTime createdAt;
    private Integer likeCount;
    private Boolean isLiked;
    private List<CommentDto> comments;

    public PostDto(Post post, AuthorDTO author, Integer likeCount, Boolean isLiked, List<CommentDto> comments) {
        this.id = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.author = author;
        this.createdAt = post.getCreatedAt();
        this.likeCount = likeCount;
        this.isLiked = isLiked;
        this.comments = comments;
    }
}
