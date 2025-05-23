package com.letsgo.devcommunity.domain.auth.service;

import com.letsgo.devcommunity.domain.auth.email.EmailVerificationStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationStore store;
    private final MailService mailService;

    private static final Duration CODE_TTL = Duration.ofMinutes(5);

    public void sendVerificationCode(String email) {
        String code = generateCode();
        store.saveCode(email, code, CODE_TTL);
        mailService.sendVerificationEmail(email, code);
    }

    public void verifyCode(String email, String inputCode) {
        store.verifyCode(email, inputCode);
    }

    public boolean isVerified(String email) {
        return store.isVerified(email);
    }

    private String generateCode() {
        int code = new Random().nextInt(900_000) + 100_000;
        return String.valueOf(code);
    }

}
