package com.letsgo.devcommunity.domain.post.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthorDTO {
    Long Id;
    String nickname;
    String ProfileImageUrl;

    public AuthorDTO(Long id, String nickname) {
        this.Id = id;
        this.nickname = nickname;
        this.ProfileImageUrl = "";
    }
}
