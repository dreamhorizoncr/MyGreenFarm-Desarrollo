package taller.multimedia.backend.controller.forum;

import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.ConstraintViolationException;
import taller.multimedia.backend.dto.common.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

/**
 * Error responses of the forum endpoints. Unexpected errors are logged and answered with a generic
 * message so internal details are not exposed.
 */
@RestControllerAdvice(basePackageClasses = ForumArticleController.class)
public class ForumExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ForumExceptionHandler.class);

    /**
     * @param exception invalid or rejected content
     * @return 400 with the message
     */
    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    /**
     * @param exception bean validation errors of the body
     * @return 400 listing each field and its error
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new MessageResponse(message));
    }

    /**
     * @param exception validation errors of path or query parameters
     * @return 400 with the message
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<MessageResponse> handleConstraintViolation(ConstraintViolationException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    /**
     * @param exception error with an HTTP status
     * @return that status with its reason
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<MessageResponse> handleResponseStatusException(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(new MessageResponse(exception.getReason()));
    }

    /**
     * @param exception any other error
     * @return 500 with a generic message
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleUnexpectedException(Exception exception) {
        log.error("Unexpected error in the forum", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("An unexpected error occurred"));
    }
}
