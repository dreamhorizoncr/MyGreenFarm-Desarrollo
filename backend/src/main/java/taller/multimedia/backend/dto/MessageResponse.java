package taller.multimedia.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    private String message;
    private String field;

    public MessageResponse(String message) {
        this.message = message;
    }

    public MessageResponse(String message, String field) {
        this.message = message;
        this.field = field;
    }

}
