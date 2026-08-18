package taller.multimedia.backend.dto;

import lombok.Data;

// DTO class for login request payload
@Data
public class LoginRequest {
    private String email;
    private String password;
}