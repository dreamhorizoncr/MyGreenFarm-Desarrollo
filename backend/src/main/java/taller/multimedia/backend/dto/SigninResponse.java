package taller.multimedia.backend.dto;

import lombok.Data;

@Data
public class SigninResponse {
    private String token;
    private UserInfoResponse user;

    public SigninResponse(String token, UserInfoResponse user) {
        this.token = token;
        this.user = user;
    }
}
