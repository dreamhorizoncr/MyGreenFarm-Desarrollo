package taller.multimedia.backend.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Clients for Supabase Storage through its S3-compatible API ({@code supabase.s3.*}). Path-style
 * access is required by Supabase.
 */
@Configuration
public class S3Config {

        @Value("${supabase.s3.endpoint}")
        private String endpoint;

        @Value("${supabase.s3.region}")
        private String region;

        @Value("${supabase.s3.access-key}")
        private String accessKey;

        @Value("${supabase.s3.secret-key}")
        private String secretKey;

        /**
         * @return the client used to upload and delete files
         */
        @Bean
        public S3Client s3Client() {
                AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

                return S3Client.builder()
                                .region(Region.of(region))
                                .endpointOverride(java.net.URI.create(endpoint))
                                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                                .forcePathStyle(true)
                                .build();
        }

        /**
         * @return the signer used to create temporary links to private files
         */
        @Bean
        public S3Presigner s3Presigner() {
                return S3Presigner.builder()
                                .endpointOverride(URI.create(endpoint))
                                .region(Region.of(region))
                                .credentialsProvider(StaticCredentialsProvider.create(
                                                AwsBasicCredentials.create(accessKey, secretKey)))
                                .serviceConfiguration(S3Configuration.builder()
                                                .pathStyleAccessEnabled(true)
                                                .build())
                                .build();
        }
}