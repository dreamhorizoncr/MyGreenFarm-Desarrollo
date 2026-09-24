package taller.multimedia.backend.dto.curriculum;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CertificateFileResponse {
    private UUID id;
    private String fileName;
    private String fileUrl;
}
