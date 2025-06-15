package com.letsgo.devcommunity;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean; // @MockBean 임포트

// 애플리케이션에서 실제로 사용하는 외부 서비스 빈들의 타입을 임포트합니다.
// 이 클래스들은 Spring 컨텍스트에서 빈으로 관리되는 객체들입니다.

// 1. 메일 서비스를 위한 JavaMailSender
import org.springframework.mail.javamail.JavaMailSender;

// 2. AWS S3 클라이언트 (사용하는 AWS SDK 버전에 따라 선택)
//    - AWS SDK v1을 사용한다면 아래 임포트를 사용합니다:
import com.amazonaws.services.s3.AmazonS3Client;
//    - AWS SDK v2를 사용한다면 아래 임포트를 사용합니다 (위 AmazonS3Client와 함께 사용하지 마세요):
// import software.amazon.awssdk.services.s3.S3Client;

// 3. Redis 연결 팩토리를 위한 RedisConnectionFactory
import org.springframework.data.redis.connection.RedisConnectionFactory;

@SpringBootTest // Spring Boot 애플리케이션의 전체 컨텍스트를 로드하여 테스트합니다.
class DevCommunityBackendApplicationTests {

    // @MockBean을 사용하여, 실제 Spring 컨텍스트에 등록될 JavaMailSender 빈 대신
    // Mockito로 생성된 가짜(Mock) JavaMailSender 객체를 주입합니다.
    // 이렇게 하면 테스트 실행 시 실제 메일 서버에 연결을 시도하지 않습니다.
    @MockBean
    private JavaMailSender javaMailSender;

    // @MockBean을 사용하여 실제 AWS S3 클라이언트 빈 대신 가짜 객체를 주입합니다.
    // 프로젝트에서 사용 중인 AWS SDK 버전에 맞는 클래스를 선택해야 합니다.
    // 예: AWS SDK v1 사용 시 AmazonS3Client
    @MockBean
    private AmazonS3Client amazonS3Client;
    // 예: AWS SDK v2 사용 시 S3Client
    // @MockBean
    // private S3Client s3Client;

    // @MockBean을 사용하여 실제 RedisConnectionFactory 빈 대신 가짜 객체를 주입합니다.
    // 이렇게 하면 테스트 시 실제 Redis 서버에 연결을 시도하지 않습니다.
    @MockBean
    private RedisConnectionFactory redisConnectionFactory;


    @Test // 이 메서드는 Spring 컨텍스트가 오류 없이 로드되는지 확인합니다.
    void contextLoads() {
        // 이 메서드 자체는 비어있습니다.
        // @SpringBootTest 어노테이션과 위에 선언된 @MockBean 덕분에
        // 외부 서비스 연결 문제 없이 컨텍스트가 성공적으로 로드될 것입니다.
    }

}
