package com.letsgo.devcommunity.domain.auth.dto;

public record VerifyCodeRequest(
        String email,
        String code
) { }
