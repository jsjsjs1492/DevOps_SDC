package com.letsgo.devcommunity.global.common;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Utilities;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URL;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FileStorageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Utilities s3Utilities;

    @InjectMocks
    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        fileStorageService = new FileStorageService(
                s3Client,
                "test-bucket-name"
        );
    }

    @Test
    @DisplayName("파일 업로드 성공")
    void uploadFile_Success() throws IOException {
        byte[] fileContent = "test content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", fileContent);

        when(s3Client.utilities()).thenReturn(s3Utilities);
        when(s3Utilities.getUrl(any(Consumer.class))).thenAnswer(invocation -> {
            Consumer<GetUrlRequest.Builder> consumer = invocation.getArgument(0);
            GetUrlRequest.Builder builder = GetUrlRequest.builder();
            consumer.accept(builder);
            GetUrlRequest request = builder.build();
            return new URL("https://" + request.bucket() + ".s3.amazonaws.com/" + request.key());
        });

        String uploadedUrl = fileStorageService.uploadFile(file, "profile-images/");

        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(captor.capture(), (RequestBody) any());
        PutObjectRequest request = captor.getValue();

        assertThat(request.bucket()).isEqualTo("test-bucket-name");
        assertThat(request.key()).startsWith("profile-images/");
        assertThat(uploadedUrl).contains("test-bucket-name")
                .contains("profile-images/")
                .contains("test.png");
    }

    @Test
    @DisplayName("파일 삭제 성공")
    void deleteFile_Success() throws IOException {
        String fileKey = "profile-images/some-uuid_test.png";

        fileStorageService.deleteFile(fileKey);

        ArgumentCaptor<Consumer<DeleteObjectRequest.Builder>> captor = ArgumentCaptor.forClass(Consumer.class);
        verify(s3Client).deleteObject(captor.capture());

        Consumer<DeleteObjectRequest.Builder> consumer = captor.getValue();
        DeleteObjectRequest.Builder builder = DeleteObjectRequest.builder();
        consumer.accept(builder);
        DeleteObjectRequest request = builder.build();

        assertThat(request.bucket()).isEqualTo("test-bucket-name");
        assertThat(request.key()).isEqualTo(fileKey);
    }

}