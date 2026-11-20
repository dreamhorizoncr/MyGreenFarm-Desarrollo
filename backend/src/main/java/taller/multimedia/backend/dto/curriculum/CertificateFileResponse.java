package taller.multimedia.backend.dto.curriculum;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * A certificate attached to an application, with a temporary link to the file.
 */
@Data
@Builder
public class CertificateFileResponse {
    private UUID id;
    private String fileName;
    private String fileUrl;
}
