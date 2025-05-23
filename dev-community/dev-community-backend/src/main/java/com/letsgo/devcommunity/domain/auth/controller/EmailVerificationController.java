package com.letsgo.devcommunity.domain.auth.controller;

import com.letsgo.devcommunity.domain.auth.dto.SendVerificationRequest;
import com.letsgo.devcommunity.domain.auth.dto.VerifyCodeRequest;
import com.letsgo.devcommunity.domain.auth.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService verificationService;

    @PostMapping("/verify")
    public ResponseEntity<Void> sendVerification(@RequestBody SendVerificationRequest request) {
        verificationService.sendVerificationCode(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/check")
    public ResponseEntity<Void> verifyCode(@RequestBody VerifyCodeRequest request) {
        verificationService.verifyCode(request.email(), request.code());
        return ResponseEntity.ok().build();
    }
}
