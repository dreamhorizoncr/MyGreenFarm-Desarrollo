package taller.multimedia.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StorageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @Test
    void uploadFile_cleansMaliciousFileNameInKeyAndUrl() {
        StorageService storageService = new StorageService(s3Client, s3Presigner);
        ReflectionTestUtils.setField(storageService, "endpoint", "https://storage.test/storage/v1/s3");
        MockMultipartFile file = new MockMultipartFile(
                "file", "<img src=x onerror=alert(1)>\"foto\".png", "image/png", new byte[] {1, 2, 3});

        String url = storageService.uploadFile(file, "gallery", "albums");

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(request.capture(), any(RequestBody.class));
        String key = request.getValue().key();

        assertThat(key).startsWith("albums/").endsWith(".png").doesNotContain("<", ">", "\"");
        assertThat(url).doesNotContain("<", ">", "\"").endsWith(key);
    }
}
