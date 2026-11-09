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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
                "file", "<img src=x onerror=alert(1)>\"foto\".png", "image/png",
                new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

        String url = storageService.uploadFile(file, "gallery", "albums");

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(request.capture(), any(RequestBody.class));
        String key = request.getValue().key();

        assertThat(key).startsWith("albums/").endsWith(".png").doesNotContain("<", ">", "\"");
        assertThat(url).doesNotContain("<", ">", "\"").endsWith(key);
    }

    @Test
    void uploadFile_rejectsContentThatDoesNotMatchDeclaredType() {
        StorageService storageService = new StorageService(s3Client, s3Presigner);
        MockMultipartFile file = new MockMultipartFile(
                "file", "foto.png", "image/png", new byte[] {1, 2, 3});

        assertThatThrownBy(() -> storageService.uploadFile(file, "gallery", "albums"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match");
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void uploadFile_rejectsFilesAboveConfiguredLimit() {
        StorageService storageService = new StorageService(s3Client, s3Presigner);
        ReflectionTestUtils.setField(storageService, "maxFileSizeBytes", 4L);
        MockMultipartFile file = new MockMultipartFile(
                "file", "foto.png", "image/png",
                new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

        assertThatThrownBy(() -> storageService.uploadFile(file, "gallery", "albums"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("maximum allowed size");
        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }
}
