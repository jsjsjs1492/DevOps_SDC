package com.letsgo.devcommunity.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SignUpRequest(
        @JsonProperty("id") String loginId,
        @JsonProperty("email") String email,
        @JsonProperty("password") String password,
        @JsonProperty("nickname") String nickname
) { }
