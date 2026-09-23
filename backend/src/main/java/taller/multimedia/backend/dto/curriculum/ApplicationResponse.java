package taller.multimedia.backend.dto.curriculum;

import lombok.Builder;
import lombok.Data;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ApplicationResponse {
    private UUID id;
    private UUID vacancyId;
    private String applicantName;
    private String applicantEmail;
    private String applicantPhone;
    private String fileName;
    private String fileUrl;
    private List<CertificateFileResponse> certificates;
    private LocalDateTime submittedAt;
    private CurriculumStatus status;
}
