package taller.multimedia.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

// What the public About Us page may show about a teacher: no email or birthday.
@Getter
@AllArgsConstructor
public class PublicTeacherResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String role;
    private String photoUrl;
}
