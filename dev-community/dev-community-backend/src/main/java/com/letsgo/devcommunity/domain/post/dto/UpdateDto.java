package com.letsgo.devcommunity.domain.post.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateDto {
    private String title;
    private String content;
    private List<String> tags;
}
