package com.letsgo.devcommunity.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LoginRequest(
        @JsonProperty("id") String loginId,
        @JsonProperty("password") String password
) { }
