package com.letsgo.devcommunity.domain.post.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CommentDto {
    private Long id;
    private String author;
    private String content;
    private LocalDateTime createdAt;

    public CommentDto(Long id, String author, String content, LocalDateTime createdAt) {
        this.id = id;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
    }
}
