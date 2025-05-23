package com.letsgo.devcommunity.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendVerificationEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[dev-community] 이메일 인증번호");
        message.setText("인증번호는 다음과 같습니다: " + code);
        message.setFrom("knw125@sogang.ac.kr");

        mailSender.send(message);
    }
}
