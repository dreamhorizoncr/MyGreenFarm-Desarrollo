package taller.multimedia.backend.service;

import taller.multimedia.backend.util.Sanitizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class StorageService {
    private static final Pattern SVG_FRAGMENT_URL = Pattern.compile(
            "url\\(\\s*(['\"]?)#[a-z0-9_.:-]+\\1\\s*\\)", Pattern.CASE_INSENSITIVE);
    private static final Set<String> ACTIVE_SVG_ELEMENTS = Set.of(
            "script", "foreignobject", "iframe", "object", "embed", "style", "animate", "set");

    private final S3Client s3Client;

    @Value("${supabase.s3.endpoint}")
    private String endpoint;

    private final S3Presigner s3Presigner;

    @Value("${storage.max-file-size-bytes:10485760}")
    private long maxFileSizeBytes;

    public StorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    public String uploadFile(MultipartFile file, String bucketName, String folder) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("The uploaded file is empty.");
            }
            if (file.getSize() > maxFileSizeBytes) {
                throw new IllegalArgumentException("The file exceeds the maximum allowed size.");
            }

            String contentType = validateAndGetContentType(file);
            String fileName = folder + "/" + UUID.randomUUID() + "_" + Sanitizer.safeFileName(file.getOriginalFilename());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(contentType)
                    .build();

            try (InputStream inputStream = file.getInputStream()) {
                s3Client.putObject(
                        putObjectRequest,
                        RequestBody.fromInputStream(inputStream, file.getSize()));
            }

            String baseUrl = endpoint.replace("/storage/v1/s3", "/storage/v1");
            return baseUrl + "/object/public/" + bucketName + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload the file to Storage", e);
        }
    }

    private String validateAndGetContentType(MultipartFile file) throws IOException {
        String declaredType = file.getContentType();
        String normalizedType = declaredType == null ? "" : declaredType.toLowerCase(Locale.ROOT);
        if (normalizedType.equals("image/svg+xml")) {
            return isSafeSvg(file.getBytes()) ? "image/svg+xml" : rejectFileType();
        }

        byte[] header;
        try (InputStream inputStream = file.getInputStream()) {
            header = inputStream.readNBytes(12);
        }
        if (hasPngSignature(header) && normalizedType.equals("image/png")) {
            return "image/png";
        }
        if (hasJpegSignature(header)
                && (normalizedType.equals("image/jpeg") || normalizedType.equals("image/jpg"))) {
            return "image/jpeg";
        }
        if (hasWebpSignature(header) && normalizedType.equals("image/webp")) {
            return "image/webp";
        }
        if (hasPdfSignature(header) && normalizedType.equals("application/pdf")) {
            return "application/pdf";
        }
        return rejectFileType();
    }

    private String rejectFileType() {
        throw new IllegalArgumentException("The file content does not match a supported file type.");
    }

    private boolean hasPngSignature(byte[] content) {
        return content.length >= 8
                && content[0] == (byte) 0x89
                && content[1] == 0x50
                && content[2] == 0x4E
                && content[3] == 0x47
                && content[4] == 0x0D
                && content[5] == 0x0A
                && content[6] == 0x1A
                && content[7] == 0x0A;
    }

    private boolean hasJpegSignature(byte[] content) {
        return content.length >= 3
                && content[0] == (byte) 0xFF
                && content[1] == (byte) 0xD8
                && content[2] == (byte) 0xFF;
    }

    private boolean hasWebpSignature(byte[] content) {
        return content.length >= 12
                && content[0] == 'R'
                && content[1] == 'I'
                && content[2] == 'F'
                && content[3] == 'F'
                && content[8] == 'W'
                && content[9] == 'E'
                && content[10] == 'B'
                && content[11] == 'P';
    }

    private boolean hasPdfSignature(byte[] content) {
        return content.length >= 5
                && content[0] == '%'
                && content[1] == 'P'
                && content[2] == 'D'
                && content[3] == 'F'
                && content[4] == '-';
    }

    private boolean isSafeSvg(byte[] content) {
        String svg = new String(content, StandardCharsets.UTF_8);
        String normalizedSvg = svg.toLowerCase(Locale.ROOT);
        if (normalizedSvg.contains("<!doctype") || normalizedSvg.contains("<!entity")) {
            return false;
        }

        org.jsoup.nodes.Document document = org.jsoup.Jsoup.parse(
                svg, "", org.jsoup.parser.Parser.xmlParser());
        org.jsoup.nodes.Element root = document.children().stream()
                .filter(element -> element.tagName().equalsIgnoreCase("svg"))
                .findFirst()
                .orElse(null);
        if (root == null) {
            return false;
        }

        for (org.jsoup.nodes.Element element : root.getAllElements()) {
            if (ACTIVE_SVG_ELEMENTS.contains(element.tagName().toLowerCase(Locale.ROOT))) {
                return false;
            }
            for (org.jsoup.nodes.Attribute attribute : element.attributes()) {
                String key = attribute.getKey().toLowerCase(Locale.ROOT);
                String value = attribute.getValue().trim().toLowerCase(Locale.ROOT);
                if (key.startsWith("on")
                        || ((key.equals("href") || key.endsWith(":href")) && !value.startsWith("#"))
                        || value.contains("javascript:")
                        || value.contains("data:")
                        || value.contains("@import")
                        || (value.contains("url(") && SVG_FRAGMENT_URL.matcher(value).replaceAll("").contains("url("))) {
                    return false;
                }
            }
        }
        return true;
    }

    public void deleteFile(String bucketName, String fileName) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete the file from Storage", e);
        }
    }

    public String getSignedUrl(String bucketName, String filePath, int expirationInSeconds) {
        try {
            GetObjectRequest getObjectRequest = 
                software.amazon.awssdk.services.s3.model.GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(filePath)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(expirationInSeconds))
                    .getObjectRequest(getObjectRequest) 
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate the signed URL for the private file", e);
        }
    }
}