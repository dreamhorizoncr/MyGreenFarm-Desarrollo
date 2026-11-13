package taller.multimedia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class PublicTeacherResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String role;
    private String photoUrl;
}
