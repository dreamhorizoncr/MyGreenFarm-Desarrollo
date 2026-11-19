package taller.multimedia.backend.service.curriculum;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.curriculum.ApplicationRequest;
import taller.multimedia.backend.dto.curriculum.ApplicationResponse;
import taller.multimedia.backend.dto.curriculum.CertificateFileResponse;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.curriculum.CurriculumCertificate;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.email.EmailService;
import taller.multimedia.backend.service.storage.StorageService;
import taller.multimedia.backend.util.Sanitizer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

/**
 * Job applications: the applicant's CV and certificates, stored in the private résumés bucket, and
 * the status the staff gives them.
 *
 * <p>Files are private; responses carry signed links that work for one hour. The received and hired
 * emails are sent at most once per application while the server is running.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;

    private final VacancyRepository vacancyRepository;

    private final StorageService storageService;

    private final EmailService emailService;

    @Value("${supabase.s3.buckets.curriculums}")
    private String curriculumsBucket;

    private final Set<UUID> receivedEmailSent = ConcurrentHashMap.newKeySet();
    private final Set<UUID> hiredEmailSent = ConcurrentHashMap.newKeySet();

    /**
     * Saves an application with its files and emails the applicant that it was received.
     *
     * @param request applicant's data and the vacancy, or no vacancy for an open application
     * @param file CV in PDF format, optional
     * @param certificates certificates in PDF, PNG, WEBP or JPEG format, optional
     * @return the saved application with signed links to its files
     * @throws IllegalArgumentException if a file has a format that is not allowed
     * @throws InvalidFieldException if a text is unsafe
     */
    @Transactional
    public ApplicationResponse submitApplication(ApplicationRequest request, MultipartFile file, List<MultipartFile> certificates) {
        Curriculum curriculum = new Curriculum();
        curriculum.setVacancyId(request.getVacancyId());
        curriculum.setApplicantName(Sanitizer.requireClean("applicantName", request.getApplicantName()));
        curriculum.setApplicantEmail(Sanitizer.requireClean("applicantEmail", request.getApplicantEmail()));
        curriculum.setApplicantPhone(request.getApplicantPhone() == null
                ? null
                : Sanitizer.requireClean("applicantPhone", request.getApplicantPhone()));
        curriculum.setLanguage(resolveLanguageCode(request.getLanguage()));
        if (request.getVacancyId() != null) {
            checkVacancyRequirements(request, file, certificates);
        }

        if (file != null && !file.isEmpty()) {
            if (!isValidCvFormat(file.getContentType())) {
                throw new IllegalArgumentException("The CV must be a PDF file.");
            }
            curriculum.setFileName(Sanitizer.safeFileName(file.getOriginalFilename()));
            curriculum.setFileUrl(storageService.uploadFile(file, curriculumsBucket, "cvs"));
        }

        if (certificates != null) {
            for (MultipartFile certificateFile : certificates) {
                if (certificateFile == null || certificateFile.isEmpty()) continue;
                if (!isValidCertificateFormat(certificateFile.getContentType())) {
                    throw new IllegalArgumentException("Certificates must be PDF, PNG, WEBP or JPEG.");
                }

                CurriculumCertificate certificate = new CurriculumCertificate();
                certificate.setFileName(Sanitizer.safeFileName(certificateFile.getOriginalFilename()));
                certificate.setFileUrl(storageService.uploadFile(certificateFile, curriculumsBucket, "certificates"));
                certificate.setCurriculum(curriculum);
                curriculum.getCertificates().add(certificate);
            }
        }

        Curriculum saved = curriculumRepository.save(curriculum);

        if (receivedEmailSent.add(saved.getId())) {
            Locale locale = Locale.forLanguageTag(saved.getLanguage());
            emailService.sendApplicationReceivedEmail(saved, resolveVacancyTitle(saved.getVacancyId()), locale);
        }

        return mapToResponse(saved);
    }

    /**
     * Checks, before any file is uploaded, that the vacancy exists, accepts applications and gets
     * every field it requires. The form checks the same, but the API must not trust it.
     *
     * @param request applicant's data and the vacancy
     * @param file CV, if any
     * @param certificates certificates, if any
     * @throws InvalidFieldException if the vacancy does not exist, is closed or a required field is missing
     */
    private void checkVacancyRequirements(ApplicationRequest request, MultipartFile file, List<MultipartFile> certificates) {
        Vacancy vacancy = vacancyRepository.findById(request.getVacancyId())
                .orElseThrow(() -> new InvalidFieldException("vacancyId", "The selected job opening does not exist."));
        if (!vacancy.isOpen()) {
            throw new InvalidFieldException("vacancyId", "This job opening is no longer accepting applications.");
        }
        List<String> required = vacancy.getRequiredFields() == null || vacancy.getRequiredFields().isBlank()
                ? List.of()
                : List.of(vacancy.getRequiredFields().split(","));
        if (required.contains("applicantPhone") && (request.getApplicantPhone() == null || request.getApplicantPhone().isBlank())) {
            throw new InvalidFieldException("applicantPhone", "This job opening requires a phone number.");
        }
        if (required.contains("file") && (file == null || file.isEmpty())) {
            throw new InvalidFieldException("file", "This job opening requires a CV.");
        }
        boolean hasCertificate = certificates != null && certificates.stream().anyMatch(c -> c != null && !c.isEmpty());
        if (required.contains("certificates") && !hasCertificate) {
            throw new InvalidFieldException("certificates", "This job opening requires at least one certificate.");
        }
    }

    /**
     * @return every application, with signed links to its files
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAllApplications() {
        return curriculumRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Changes the status of an application without assigning a vacancy.
     *
     * @param id application ID
     * @param status new status
     * @param lang language used for the hired email when the application has none
     * @return the updated application
     * @see #setStatus(UUID, CurriculumStatus, String, UUID)
     */
    @Transactional
    public ApplicationResponse setStatus(UUID id, CurriculumStatus status, String lang) {
        return setStatus(id, status, lang, null);
    }

    /**
     * Changes the status of an application. When it is approved, an open application can be
     * assigned to a vacancy, and the applicant receives the hired email the first time.
     *
     * @param id application ID
     * @param status new status
     * @param lang language used for the hired email when the application has none
     * @param vacancyId vacancy to assign when approving an open application, optional
     * @return the updated application
     * @throws RuntimeException if the application does not exist
     * @throws InvalidFieldException if the vacancy does not exist
     */
    @Transactional
    public ApplicationResponse setStatus(UUID id, CurriculumStatus status, String lang, UUID vacancyId) {
        Curriculum curriculum = findEntityById(id);
        CurriculumStatus previousStatus = curriculum.getStatus();
        curriculum.setStatus(status);

        if (status == CurriculumStatus.APPROVED && curriculum.getVacancyId() == null && vacancyId != null) {
            if (!vacancyRepository.existsById(vacancyId)) {
                throw new InvalidFieldException("vacancyId", "The selected job opening does not exist.");
            }
            curriculum.setVacancyId(vacancyId);
        }

        Curriculum saved = curriculumRepository.save(curriculum);

        if (previousStatus != status && status == CurriculumStatus.APPROVED && hiredEmailSent.add(id)) {
            String languageCode = saved.getLanguage() != null ? saved.getLanguage() : resolveLanguageCode(lang);
            Locale locale = Locale.forLanguageTag(languageCode);
            emailService.sendApplicationHiredEmail(saved, resolveHiredVacancyTitle(saved.getVacancyId()), locale);
        }

        return mapToResponse(saved);
    }

    /**
     * Deletes an application and its files. A file that cannot be deleted from storage is logged
     * and skipped.
     *
     * @param id application ID
     * @throws RuntimeException if the application does not exist
     */
    @Transactional
    public void deleteCurriculum(UUID id) {
        Curriculum curriculum = findEntityById(id);

        deleteFileQuietly(curriculum.getFileUrl());
        curriculum.getCertificates().forEach(certificate -> deleteFileQuietly(certificate.getFileUrl()));

        curriculumRepository.delete(curriculum);
    }

    /**
     * @param requestedLanguage language sent by the form, for example {@code en-US}
     * @return {@code fr}, {@code en} or {@code es} (the default)
     */
    private String resolveLanguageCode(String requestedLanguage) {
        if (requestedLanguage == null || requestedLanguage.isBlank()) {
            return "es";
        }

        String normalized = requestedLanguage.toLowerCase().trim();

        if (normalized.contains("fr")) return "fr";
        if (normalized.contains("en")) return "en";
        if (normalized.contains("es")) return "es";

        return "es";
    }

    /**
     * @param vacancyId vacancy of the application, may be {@code null}
     * @return the vacancy title, or "Postulación espontánea" for an open application
     */
    private String resolveVacancyTitle(UUID vacancyId) {
        if (vacancyId == null) return "Postulación espontánea";
        return vacancyRepository.findById(vacancyId)
                .map(Vacancy::getTitle)
                .orElse("Postulación espontánea");
    }

    private String resolveHiredVacancyTitle(UUID vacancyId) {
        if (vacancyId == null) return null;
        return vacancyRepository.findById(vacancyId).map(Vacancy::getTitle).orElse(null);
    }

    private Curriculum findEntityById(UUID id) {
        return curriculumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found with ID: " + id));
    }

    private void deleteFileQuietly(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;
        String filePath = extractPathFromUrl(fileUrl, curriculumsBucket);
        if (filePath == null) return;
        try {
            storageService.deleteFile(curriculumsBucket, filePath);
        } catch (Exception e) {
            log.warn("Could not delete the file from the bucket: {}", e.getMessage());
        }
    }

    private boolean isValidCvFormat(String contentType) {
        return "application/pdf".equals(contentType);
    }

    private boolean isValidCertificateFormat(String contentType) {
        return contentType != null && (
                contentType.equals("application/pdf") ||
                contentType.equals("image/png") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/webp"));
    }

    private String extractPathFromUrl(String fileUrl, String bucketName) {
        try {
            String marker = "/" + bucketName + "/";
            int index = fileUrl.indexOf(marker);
            if (index != -1) {
                return fileUrl.substring(index + marker.length());
            }
        } catch (Exception e) {
            log.warn("Error extracting the path from the URL: {}", e.getMessage());
        }
        return null;
    }

    /**
     * @param fileUrl stored URL of a private file
     * @return a link to the file valid for one hour, or {@code null} when there is no file
     */
    private String signedUrlOrNull(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return null;
        String filePath = extractPathFromUrl(fileUrl, curriculumsBucket);
        if (filePath == null) return null;
        return storageService.getSignedUrl(curriculumsBucket, filePath, 3600);
    }

    private ApplicationResponse mapToResponse(Curriculum curriculum) {
        List<CertificateFileResponse> certificates = curriculum.getCertificates() == null
                ? Collections.emptyList()
                : curriculum.getCertificates().stream()
                        .map(certificate -> CertificateFileResponse.builder()
                                .id(certificate.getId())
                                .fileName(certificate.getFileName())
                                .fileUrl(signedUrlOrNull(certificate.getFileUrl()))
                                .build())
                        .collect(Collectors.toList());

        return ApplicationResponse.builder()
                .id(curriculum.getId())
                .vacancyId(curriculum.getVacancyId())
                .applicantName(curriculum.getApplicantName())
                .applicantEmail(curriculum.getApplicantEmail())
                .applicantPhone(curriculum.getApplicantPhone())
                .fileName(curriculum.getFileName())
                .fileUrl(signedUrlOrNull(curriculum.getFileUrl()))
                .certificates(certificates)
                .submittedAt(curriculum.getSubmittedAt())
                .status(curriculum.getStatus())
                .build();
    }
}
