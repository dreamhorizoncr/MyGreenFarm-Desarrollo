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
import java.time.Duration;
import java.util.UUID;

@Service
public class StorageService {

    private final S3Client s3Client;

    @Value("${supabase.s3.endpoint}")
    private String endpoint;

    private final S3Presigner s3Presigner;

    public StorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    public String uploadFile(MultipartFile file, String bucketName, String folder) {
        try {
            // El nombre original viene del usuario: se limpia antes de usarlo en la ruta y en la URL pública
            String fileName = folder + "/" + UUID.randomUUID() + "_" + Sanitizer.safeFileName(file.getOriginalFilename());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));

            String baseUrl = endpoint.replace("/storage/v1/s3", "/storage/v1");
            return baseUrl + "/object/public/" + bucketName + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("Fallo al subir el archivo al Storage", e);
        }
    }

    public void deleteFile(String bucketName, String fileName) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception e) {
            throw new RuntimeException("Fallo al eliminar el archivo del Storage", e);
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
            throw new RuntimeException("Fallo al generar la URL firmada para el archivo privado", e);
        }
    }
}