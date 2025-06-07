package com.letsgo.devcommunity.domain.auth.email;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class RedisEmailVerificationStoreTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private RedisEmailVerificationStore redisEmailVerificationStore;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("이메일 인증 코드 저장 성공")
    void saveEmailVerificationCode_Success() {
        String email = "test@example.com";
        String code = "123456";
        Duration ttl = Duration.ofMinutes(5);

        redisEmailVerificationStore.saveCode(email, code, ttl);

        verify(valueOperations).set(
            "email:verification:code:" + email,
            code,
            ttl.toSeconds(),
            TimeUnit.SECONDS
        );
    }

    @Test
    @DisplayName("이메일 인증 코드 검증 성공")
    void verifyCode_Success() {
        String email = "test@example.com";
        String code = "123456";

        when(valueOperations.get("email:verification:code:" + email)).thenReturn(code);

        redisEmailVerificationStore.verifyCode(email, code);

        verify(redisTemplate).delete("email:verification:code:" + email);
        verify(valueOperations).set(
                "email:verification:verified:" + email,
                true,
                24, TimeUnit.HOURS
        );
    }

    @Test
    @DisplayName("이메일 인증 코드 검증 실패: 코드 불일치")
    void verifyCode_Failure_CodeMismatch() {
        String email = "test@example.com";
        String code = "123456";
        String wrongCode = "654321";

        when(valueOperations.get("email:verification:code:" + email)).thenReturn(code);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisEmailVerificationStore.verifyCode(email, wrongCode)
        );

        assertThat(exception.getMessage()).isEqualTo("인증 코드가 일치하지 않습니다.");
    }

    @Test
    @DisplayName("이메일 인증 상태 확인: 인증됨")
    void isVerified_True() {
        String email = "test@example.com";

        when(valueOperations.get("email:verification:verified:" + email)).thenReturn(true);

        boolean isVerified = redisEmailVerificationStore.isVerified(email);

        assertThat(isVerified).isTrue();
    }

    @Test
    @DisplayName("이메일 인증 상태 확인: 인증되지 않음")
    void isVerified_False() {
        String email = "test@example.com";

        when(valueOperations.get("email:verification:verified:" + email)).thenReturn(null);

        boolean isVerified = redisEmailVerificationStore.isVerified(email);

        assertThat(isVerified).isFalse();
    }

}