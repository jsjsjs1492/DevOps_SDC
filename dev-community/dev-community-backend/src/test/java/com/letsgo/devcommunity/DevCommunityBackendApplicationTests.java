package com.letsgo.devcommunity;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import software.amazon.awssdk.services.s3.S3Client;

@SpringBootTest
class DevCommunityBackendApplicationTests {

	@MockBean
	private JavaMailSender javaMailSender;

	@MockBean
	private S3Client s3Client;

	@Test
	void contextLoads() {
	}

}