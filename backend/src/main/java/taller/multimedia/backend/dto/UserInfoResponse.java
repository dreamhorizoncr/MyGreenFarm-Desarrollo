package taller.multimedia.backend.dto;

import lombok.Getter;

import java.time.LocalDate;
import java.util.UUID;

// DTO class for user information response payload
@Getter 
public class UserInfoResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private LocalDate birthday;

    public UserInfoResponse(UUID id, String email, String firstName, String lastName, String role, LocalDate birthday) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.birthday = birthday;
    }

}