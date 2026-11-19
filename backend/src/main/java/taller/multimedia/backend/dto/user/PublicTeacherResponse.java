package taller.multimedia.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

/**
 * A teacher as shown on the public About us page, without email or other private data.
 */
@Getter
@AllArgsConstructor
public class PublicTeacherResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String role;
    private String photoUrl;
}
