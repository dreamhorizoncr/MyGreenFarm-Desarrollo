package taller.multimedia.backend.dto.auth;

import lombok.Getter;
import taller.multimedia.backend.dto.user.UserInfoResponse;

/**
 * Response of a successful sign-in: the JWT, which the frontend sends as a Bearer token, and the
 * user's data.
 */
@Getter 
public class SigninResponse {
    private String token;
    private UserInfoResponse user;

    public SigninResponse(String token, UserInfoResponse user) {
        this.token = token;
        this.user = user;
    }
}
