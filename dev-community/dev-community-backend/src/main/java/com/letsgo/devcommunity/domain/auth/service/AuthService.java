package com.letsgo.devcommunity.domain.auth.service;

import com.letsgo.devcommunity.domain.auth.dto.LoginRequest;
import com.letsgo.devcommunity.domain.auth.dto.SignUpRequest;
import com.letsgo.devcommunity.domain.auth.email.EmailVerificationStore;
import com.letsgo.devcommunity.domain.member.entity.Member;
import com.letsgo.devcommunity.domain.auth.repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationStore emailVerificationStore;

    @Transactional
    public void signUp(SignUpRequest request) {
        validateEmailVerification(request.email());
        validateDuplicateLoginId(request.loginId());
        validateDuplicateEmail(request.email());

        String encodedPassword = passwordEncoder.encode(request.password());

        Member member = new Member(
                request.loginId(),
                request.email(),
                encodedPassword,
                request.nickname(),
                null
        );

        authRepository.save(member);
    }

    @Transactional(readOnly = true)
    public Member login(LoginRequest request) {
        Member member = authRepository.findByLoginId(request.loginId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        return member;
    }

    private void validateEmailVerification(String email) {
        if (!emailVerificationStore.isVerified(email)) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }
    }


    private void validateDuplicateLoginId(String loginId) {
        if (authRepository.existsByLoginId(loginId)) {
            throw new IllegalArgumentException("이미 사용 중인 ID 입니다.");
        }
    }

    private void validateDuplicateEmail(String email) {
        if (authRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
    }
}
