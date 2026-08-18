package taller.multimedia.backend.dto;

import lombok.Data;

// DTO class for message response payload
@Data
public class MessageResponse {
    private String message;

    public MessageResponse(String message) {
        this.message = message;
    }

}
