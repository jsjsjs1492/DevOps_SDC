package com.letsgo.devcommunity.domain.auth.email;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
@Primary
@RequiredArgsConstructor
public class RedisEmailVerificationStore implements EmailVerificationStore {
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CODE_PREFIX = "email:verification:code:";
    private static final String VERIFIED_PREFIX = "email:verification:verified:";

    @Override
    public void saveCode(String email, String code, Duration ttl) {
        String key = CODE_PREFIX + email;
        redisTemplate.opsForValue().set(key, code, ttl.toSeconds(), TimeUnit.SECONDS);
    }

    @Override
    public void verifyCode(String email, String code) {
        String key = CODE_PREFIX + email;
        String storedCode = (String) redisTemplate.opsForValue().get(key);

        if (storedCode == null || !storedCode.equals(code)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않습니다.");
        }

        redisTemplate.delete(key);
        redisTemplate.opsForValue().set(VERIFIED_PREFIX + email, true, 24, TimeUnit.HOURS);
    }

    @Override
    public boolean isVerified(String email) {
        Boolean isVerified = (Boolean) redisTemplate.opsForValue().get(VERIFIED_PREFIX + email);
        return isVerified != null && isVerified;
    }
}
