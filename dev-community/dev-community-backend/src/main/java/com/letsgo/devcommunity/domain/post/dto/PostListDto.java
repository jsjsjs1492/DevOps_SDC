package com.letsgo.devcommunity.domain.post.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PostListDto {
    Integer totalPages;
    Integer totalElements;
    Integer number;
    Integer size;
    List<ContentDto> content;

    public PostListDto(Integer totalPages, Integer totalElements, Integer number, Integer size, List<ContentDto> content) {
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.number = number;
        this.size = size;
        this.content = content;
    }
}
