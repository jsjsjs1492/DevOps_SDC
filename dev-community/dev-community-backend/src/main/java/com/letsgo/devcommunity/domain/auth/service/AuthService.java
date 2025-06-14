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

import static com.letsgo.devcommunity.global.common.FileStorageService.DEFAULT_PROFILE_IMAGE_URL;

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
        validatePassword(request.password());

        String encodedPassword = passwordEncoder.encode(request.password());

        Member member = new Member(
                request.loginId(),
                request.email(),
                encodedPassword,
                request.nickname(),
                DEFAULT_PROFILE_IMAGE_URL
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

    private void validatePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 20) {
            throw new IllegalArgumentException("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
        }
        boolean hasUpperCase = false;
        boolean hasLowerCase = false;
        boolean hasDigit = false;
        boolean hasSpecialChar = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpperCase = true;
            } else if (Character.isLowerCase(c)) {
                hasLowerCase = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (!Character.isLetterOrDigit(c)) {
                hasSpecialChar = true;
            }
        }

        if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
            throw new IllegalArgumentException("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
        }
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
