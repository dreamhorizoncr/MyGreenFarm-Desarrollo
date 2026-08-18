package taller.multimedia.backend.dto;

import lombok.Data;

// DTO class for user information response payload
@Data
public class UserInfoResponse {
    private Integer id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;

    public UserInfoResponse(Integer id, String email, String firstName, String lastName, String role) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }

}