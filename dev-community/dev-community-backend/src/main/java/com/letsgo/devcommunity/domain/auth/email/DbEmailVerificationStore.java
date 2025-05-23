package com.letsgo.devcommunity.domain.auth.email;

import com.letsgo.devcommunity.domain.auth.entity.EmailVerification;
import com.letsgo.devcommunity.domain.auth.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class DbEmailVerificationStore implements EmailVerificationStore{

    private final EmailVerificationRepository repository;

    @Override
    public void saveCode(String email, String code, Duration ttl) {
        EmailVerification verification = repository.findByEmail(email)
                .map(existing -> {
                    existing.reissueCode(code, ttl);
                    return existing;
                })
                .orElse(new EmailVerification(email, code, ttl));
        repository.save(verification);
    }

    @Override
    public void verifyCode(String email, String code) {
        EmailVerification verification = repository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일의 인증 정보가 없습니다."));
        verification.verify(code);
        repository.save(verification);
    }

    @Override
    public boolean isVerified(String email) {
        return repository.findByEmail(email)
                .map(EmailVerification::isVerified)
                .orElse(false);
    }
}
