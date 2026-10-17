package taller.multimedia.backend.controller;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @SuppressWarnings("unused")
    private void sample(String value) {
    }

    @Test
    void validationErrors_returnTheFieldMessagesWithoutTechnicalNames() throws Exception {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "club");
        result.addError(new FieldError("club", "name", "El nombre es obligatorio"));
        result.addError(new FieldError("club", "schedule", "El horario es obligatorio"));
        Method method = getClass().getDeclaredMethod("sample", String.class);
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(new MethodParameter(method, 0), result);

        ResponseEntity<MessageResponse> response = handler.handleValidation(exception);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo("El nombre es obligatorio. El horario es obligatorio");
    }

    @Test
    void invalidField_keepsTheBusinessMessage() {
        ResponseEntity<MessageResponse> response = handler.handleInvalidField(new InvalidFieldException("title", "Ya existe una categoría con ese nombre."));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo("Ya existe una categoría con ese nombre.");
    }

    @Test
    void tooLargeUploads_andDuplicates_explainTheCause() {
        assertThat(handler.handleMaxUploadSize(new MaxUploadSizeExceededException(1)).getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        ResponseEntity<MessageResponse> duplicate = handler.handleDataIntegrity(new DataIntegrityViolationException("duplicate key"));
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(duplicate.getBody().getMessage()).doesNotContain("duplicate key");
    }
}
