package com.letsgo.devcommunity.domain.auth.service;

import com.letsgo.devcommunity.domain.auth.dto.LoginRequest;
import com.letsgo.devcommunity.domain.auth.dto.SignUpRequest;
import com.letsgo.devcommunity.domain.auth.email.EmailVerificationStore;
import com.letsgo.devcommunity.domain.auth.repository.AuthRepository;
import com.letsgo.devcommunity.domain.member.entity.Member;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static com.letsgo.devcommunity.global.common.FileStorageService.DEFAULT_PROFILE_IMAGE_URL;
import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthRepository authRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailVerificationStore emailVerificationStore;

    @InjectMocks
    private AuthService authService;

    enum ErrorMessage {
        EMAIL_NOT_VERIFIED("이메일 인증이 완료되지 않았습니다."),
        DUPLICATE_LOGIN_ID("이미 사용 중인 ID 입니다."),
        DUPLICATE_EMAIL("이미 가입된 이메일입니다."),
        NOT_FOUND_MEMBER("존재하지 않는 사용자입니다."),
        WRONG_PASSWORD("비밀번호가 일치하지 않습니다.");

        private final String message;

        ErrorMessage(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }

    @Test
    @DisplayName("회원가입 성공")
    void signUp_Success() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createDefaultSignUpRequest();
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);
        when(passwordEncoder.encode(signUpRequest.password())).thenReturn("encodedPassword");

        // when
        assertDoesNotThrow(() -> authService.signUp(signUpRequest));

        // then
        verify(emailVerificationStore).isVerified(signUpRequest.email());
        verify(authRepository).existsByLoginId(signUpRequest.loginId());
        verify(authRepository).existsByEmail(signUpRequest.email());
        verify(passwordEncoder).encode(signUpRequest.password());

        ArgumentCaptor<Member> memberCaptor = ArgumentCaptor.forClass(Member.class);
        verify(authRepository).save(memberCaptor.capture());

        Member capturedMember = memberCaptor.getValue();
        Member expectedMember = new Member(
                signUpRequest.loginId(),
                signUpRequest.email(),
                "encodedPassword",
                signUpRequest.nickname(),
                DEFAULT_PROFILE_IMAGE_URL
        );

        assertThat(capturedMember).isEqualTo(expectedMember);
    }

    @Test
    @DisplayName("회원가입 실패: 이메일 인증 미완료")
    void signUp_Failure_EmailNotVerified() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createDefaultSignUpRequest();
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> authService.signUp(signUpRequest)
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(ErrorMessage.EMAIL_NOT_VERIFIED.getMessage());
        verify(emailVerificationStore).isVerified(signUpRequest.email());
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 아이디 중복")
    void signUp_Failure_DuplicateLoginId() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createDefaultSignUpRequest();
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(true);

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> authService.signUp(signUpRequest)
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(ErrorMessage.DUPLICATE_LOGIN_ID.getMessage());
        verify(emailVerificationStore).isVerified(signUpRequest.email());
        verify(authRepository).existsByLoginId(signUpRequest.loginId());
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 이메일 중복")
    void signUp_Failure_DuplicateEmail() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createDefaultSignUpRequest();
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(true);

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> authService.signUp(signUpRequest)
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(ErrorMessage.DUPLICATE_EMAIL.getMessage());
        verify(emailVerificationStore).isVerified(signUpRequest.email());
        verify(authRepository).existsByLoginId(signUpRequest.loginId());
        verify(authRepository).existsByEmail(signUpRequest.email());
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 성공: 유효한 비밀번호")
    void signUp_Success_ValidPassword() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("validUser", "valid@example.com", "ValidPass1!", "validNickname");
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);
        when(passwordEncoder.encode(signUpRequest.password())).thenReturn("encodedPassword");

        // when & then
        assertDoesNotThrow(() -> authService.signUp(signUpRequest));
        verify(passwordEncoder).encode(signUpRequest.password()); // 비밀번호 인코딩 호출 검증
        verify(authRepository).save(any(Member.class)); // 저장 호출 검증
    }

    @Test
    @DisplayName("회원가입 실패: 비밀번호가 너무 짧음")
    void signUp_Failure_PasswordTooShort() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("testuser", "test@example.com", "Short1!", "testNickname");
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> authService.signUp(signUpRequest));

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 비밀번호가 너무 긺")
    void signUp_Failure_PasswordTooLong() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("testuser", "test@example.com", "LooooooooongPassword1!", "testNickname"); // 22 chars
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> authService.signUp(signUpRequest));

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 8자 이상 20자 이하로 입력해주세요.");
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 비밀번호에 대문자 없음")
    void signUp_Failure_PasswordNoUpperCase() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("testuser", "test@example.com", "nouppercase1!", "testNickname");
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> authService.signUp(signUpRequest));

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 비밀번호에 소문자 없음")
    void signUp_Failure_PasswordNoLowerCase() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("testuser", "test@example.com", "NOLOWERCASE1!", "testNickname");
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> authService.signUp(signUpRequest));

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 비밀번호에 숫자 없음")
    void signUp_Failure_PasswordNoDigit() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("testuser", "test@example.com", "NoDigitPass!", "testNickname");
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> authService.signUp(signUpRequest));

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("회원가입 실패: 비밀번호에 특수문자 없음")
    void signUp_Failure_PasswordNoSpecialChar() {
        // given
        SignUpRequest signUpRequest = TestDataFactory.createSignUpRequest("testuser", "test@example.com", "NoSpecialChar1", "testNickname");
        when(emailVerificationStore.isVerified(signUpRequest.email())).thenReturn(true);
        when(authRepository.existsByLoginId(signUpRequest.loginId())).thenReturn(false);
        when(authRepository.existsByEmail(signUpRequest.email())).thenReturn(false);

        // when
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> authService.signUp(signUpRequest));

        // then
        assertThat(exception.getMessage()).isEqualTo("비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.");
        verify(authRepository, never()).save(any(Member.class));
    }

    @Test
    @DisplayName("로그인 성공")
    void login_Success() {
        // given
        LoginRequest loginRequest = TestDataFactory.createDefaultLoginRequest();
        Member member = TestDataFactory.createMember(
                loginRequest.loginId(),
                "defaultEmail@example.com",
                "encodedPassword",
                "defaultNickname"
        );

        when(authRepository.findByLoginId(loginRequest.loginId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(loginRequest.password(), member.getPassword())).thenReturn(true);

        // when
        assertDoesNotThrow(() -> authService.login(loginRequest));

        // then
        verify(authRepository).findByLoginId(loginRequest.loginId());
        verify(passwordEncoder).matches(loginRequest.password(), member.getPassword());
    }


    @Test
    @DisplayName("로그인 실패: 존재하지 않는 사용자")
    void login_Failure_NotFoundMember(){
        // given
        LoginRequest loginRequest = TestDataFactory.createDefaultLoginRequest();
        when(authRepository.findByLoginId(loginRequest.loginId())).thenReturn(Optional.empty());

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(loginRequest)
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(ErrorMessage.NOT_FOUND_MEMBER.getMessage());
        verify(authRepository).findByLoginId(loginRequest.loginId());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("로그인 실패: 비밀번호 불일치")
    void login_Failure_WrongPassword(){
        // given
        LoginRequest loginRequest = TestDataFactory.createDefaultLoginRequest();
        Member member = TestDataFactory.createMember(
                loginRequest.loginId(),
                "defaultEmail@example.com",
                "encodedPassword",
                "defaultNickname"
        );
        when(authRepository.findByLoginId(loginRequest.loginId())).thenReturn(Optional.of(member));
        when(passwordEncoder.matches(loginRequest.password(), member.getPassword())).thenReturn(false);

        // when
        IllegalArgumentException illegalArgumentException = assertThrows(
                IllegalArgumentException.class,
                () -> authService.login(loginRequest)
        );

        // then
        assertThat(illegalArgumentException.getMessage()).isEqualTo(ErrorMessage.WRONG_PASSWORD.getMessage());
        verify(authRepository).findByLoginId(loginRequest.loginId());
        verify(passwordEncoder).matches(loginRequest.password(), member.getPassword());
    }

}

class TestDataFactory {

    // 기본 계정 정보 생성
    static SignUpRequest createDefaultSignUpRequest() {
        return new SignUpRequest("defaultLoginId", "defaultEmail@example.com", "DefaultPass1!", "defaultNickname"); // 수정된 비밀번호
    }

    // 커스터마이징 계정 정보 생성
    static SignUpRequest createSignUpRequest(String loginId, String email, String password, String nickname) {
        return new SignUpRequest(loginId, email, password, nickname);
    }

    static LoginRequest createDefaultLoginRequest() {
        return new LoginRequest("defaultLoginId", "defaultPassword");
    }

    static LoginRequest createLoginRequest(String loginId, String password) {
        return new LoginRequest(loginId, password);
    }

    static Member createMember(String loginId, String email, String password, String nickname) {
        return new Member(loginId, email, password, nickname, DEFAULT_PROFILE_IMAGE_URL);
    }
}