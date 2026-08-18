package taller.multimedia.backend.dto;

import lombok.Data;

// DTO class for signup request payload
@Data
public class SignupRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String role;

}