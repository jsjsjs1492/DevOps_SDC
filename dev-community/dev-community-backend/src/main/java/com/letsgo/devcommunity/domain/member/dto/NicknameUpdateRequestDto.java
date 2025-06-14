package com.letsgo.devcommunity.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NicknameUpdateRequestDto {
    @NotBlank(message = "새로운 닉네임을 입력해주세요.")
    private String nickname;
}
