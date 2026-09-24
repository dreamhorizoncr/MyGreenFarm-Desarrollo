package taller.multimedia.backend.service.curriculum;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.curriculum.ApplicationRequest;
import taller.multimedia.backend.dto.curriculum.ApplicationResponse;
import taller.multimedia.backend.dto.curriculum.CertificateFileResponse;
import taller.multimedia.backend.model.curriculum.Curriculum;
import taller.multimedia.backend.model.curriculum.CurriculumCertificate;
import taller.multimedia.backend.model.curriculum.CurriculumStatus;
import taller.multimedia.backend.model.vacancy.Vacancy;
import taller.multimedia.backend.repository.curriculum.CurriculumRepository;
import taller.multimedia.backend.repository.vacancy.VacancyRepository;
import taller.multimedia.backend.service.EmailService;
import taller.multimedia.backend.service.StorageService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;

    private final VacancyRepository vacancyRepository;

    private final StorageService storageService;

    private final EmailService emailService;

    @Value("${supabase.s3.buckets.curriculums}")
    private String curriculumsBucket;

    @Transactional
    public ApplicationResponse submitApplication(ApplicationRequest request, MultipartFile file, List<MultipartFile> certificates) {
        Curriculum curriculum = new Curriculum();
        curriculum.setVacancyId(request.getVacancyId());
        curriculum.setApplicantName(request.getApplicantName());
        curriculum.setApplicantEmail(request.getApplicantEmail());
        curriculum.setApplicantPhone(request.getApplicantPhone());
        curriculum.setLanguage(resolverLangCode(request.getLanguage()));

        if (file != null && !file.isEmpty()) {
            if (!isValidCvFormat(file.getContentType())) {
                throw new IllegalArgumentException("El CV debe ser un archivo PDF.");
            }
            curriculum.setFileName(file.getOriginalFilename());
            curriculum.setFileUrl(storageService.uploadFile(file, curriculumsBucket, "cvs"));
        }

        if (certificates != null) {
            for (MultipartFile certificateFile : certificates) {
                if (certificateFile == null || certificateFile.isEmpty()) continue;
                if (!isValidCertificateFormat(certificateFile.getContentType())) {
                    throw new IllegalArgumentException("Los certificados deben ser PDF, PNG o JPEG.");
                }

                CurriculumCertificate certificate = new CurriculumCertificate();
                certificate.setFileName(certificateFile.getOriginalFilename());
                certificate.setFileUrl(storageService.uploadFile(certificateFile, curriculumsBucket, "certificates"));
                certificate.setCurriculum(curriculum);
                curriculum.getCertificates().add(certificate);
            }
        }

        Curriculum saved = curriculumRepository.save(curriculum);

        Locale locale = Locale.forLanguageTag(saved.getLanguage());
        emailService.sendApplicationReceivedEmail(saved, resolveVacancyTitle(saved.getVacancyId()), locale);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAllApplications() {
        return curriculumRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationResponse setStatus(UUID id, CurriculumStatus status, String lang) {
        Curriculum curriculum = findEntityById(id);
        CurriculumStatus previousStatus = curriculum.getStatus();
        curriculum.setStatus(status);

        Curriculum saved = curriculumRepository.save(curriculum);

        if (previousStatus != status && status == CurriculumStatus.APPROVED) {
            String languageCode = saved.getLanguage() != null ? saved.getLanguage() : resolverLangCode(lang);
            Locale locale = Locale.forLanguageTag(languageCode);
            emailService.sendApplicationHiredEmail(saved, resolveVacancyTitle(saved.getVacancyId()), locale);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteCurriculum(UUID id) {
        Curriculum curriculum = findEntityById(id);

        deleteFileQuietly(curriculum.getFileUrl());
        curriculum.getCertificates().forEach(certificate -> deleteFileQuietly(certificate.getFileUrl()));

        curriculumRepository.delete(curriculum);
    }

    private String resolverLangCode(String languageFromDto) {
        if (languageFromDto == null || languageFromDto.isBlank()) {
            return "es";
        }

        String normalizado = languageFromDto.toLowerCase().trim();

        if (normalizado.contains("fr")) return "fr";
        if (normalizado.contains("en")) return "en";
        if (normalizado.contains("es")) return "es";

        return "es";
    }

    private String resolveVacancyTitle(UUID vacancyId) {
        if (vacancyId == null) return "Postulación espontánea";
        return vacancyRepository.findById(vacancyId)
                .map(Vacancy::getTitle)
                .orElse("Postulación espontánea");
    }

    private Curriculum findEntityById(UUID id) {
        return curriculumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Postulación no encontrada con ID: " + id));
    }

    private void deleteFileQuietly(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;
        String filePath = extractPathFromUrl(fileUrl, curriculumsBucket);
        if (filePath == null) return;
        try {
            storageService.deleteFile(curriculumsBucket, filePath);
        } catch (Exception e) {
            System.err.println("No se pudo borrar el archivo del bucket: " + e.getMessage());
        }
    }

    private boolean isValidCvFormat(String contentType) {
        return "application/pdf".equals(contentType);
    }

    private boolean isValidCertificateFormat(String contentType) {
        return contentType != null && (
                contentType.equals("application/pdf") ||
                contentType.equals("image/png") ||
                contentType.equals("image/jpeg"));
    }

    private String extractPathFromUrl(String fileUrl, String bucketName) {
        try {
            String marker = "/" + bucketName + "/";
            int index = fileUrl.indexOf(marker);
            if (index != -1) {
                return fileUrl.substring(index + marker.length());
            }
        } catch (Exception e) {
            System.err.println("Error al extraer la ruta de la URL: " + e.getMessage());
        }
        return null;
    }

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
