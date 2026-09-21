package taller.multimedia.backend.dto;

import lombok.Getter;
import taller.multimedia.backend.security.services.UserDetailsImpl;

@Getter 
public class AuthResult {
    private final UserInfoResponse userInfo;
    private final UserDetailsImpl userDetails;

    public AuthResult(UserInfoResponse userInfo, UserDetailsImpl userDetails) {
        this.userInfo = userInfo;
        this.userDetails = userDetails;
    }
}