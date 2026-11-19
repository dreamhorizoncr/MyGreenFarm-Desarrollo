package taller.multimedia.backend.dto.auth;

import lombok.Getter;
import taller.multimedia.backend.security.service.UserDetailsImpl;
import taller.multimedia.backend.dto.user.UserInfoResponse;

/**
 * Result of a successful sign-in: the data returned to the frontend and the details used to issue
 * the JWT.
 */
@Getter 
public class AuthResult {
    private final UserInfoResponse userInfo;
    private final UserDetailsImpl userDetails;

    public AuthResult(UserInfoResponse userInfo, UserDetailsImpl userDetails) {
        this.userInfo = userInfo;
        this.userDetails = userDetails;
    }
}