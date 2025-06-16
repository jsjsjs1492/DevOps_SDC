package com.letsgo.devcommunity.domain.post.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthorDTO {
    Long Id;
    String nickname;
    String ProfileImageUrl;
    String loginId;

    public AuthorDTO(Long id, String nickname, String loginId) {
        this.Id = id;
        this.nickname = nickname;
        this.ProfileImageUrl = "";
        this.loginId = loginId;
    }
}
