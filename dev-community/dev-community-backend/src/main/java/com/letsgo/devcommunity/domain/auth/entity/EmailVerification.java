package com.letsgo.devcommunity.domain.auth.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;

import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private boolean isVerified = false;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreatedDate
    private LocalDateTime createdAt;

    public EmailVerification(String email, String code, Duration ttl) {
        this.email = email;
        this.code = code;
        this.expiresAt = LocalDateTime.now().plus(ttl);
    }

    public void verify(String inputCode) {
        if (isExpired()) {
            throw new IllegalStateException("인증번호가 만료되었습니다.");
        }

        if (!this.code.equals(inputCode)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        this.isVerified = true;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }

    public void reissueCode(String newCode, Duration ttl) {
        this.code = newCode;
        this.expiresAt = LocalDateTime.now().plus(ttl);
        this.isVerified = false;
    }

}
