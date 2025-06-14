package com.letsgo.devcommunity.domain.post.dto;

import com.letsgo.devcommunity.domain.post.entity.Post;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ContentDto {
    Long id;
    String title;
    AuthorDTO author;
    Integer likeCount;
    Integer commentCount;
    LocalDateTime createdAt;
    List<String> tags;

    public static ContentDto fromEntity(Post post, Integer likeCount, Integer commentCount, AuthorDTO authorDTO, List<String> tags) {
        return new ContentDto(
                post.getId(),
                post.getTitle(),
                authorDTO,
                likeCount,
                commentCount,
                post.getCreatedAt(),
                tags
        );
    }
}
