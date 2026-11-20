package taller.multimedia.backend.controller.common;

import java.util.stream.Collectors;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import taller.multimedia.backend.dto.common.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

/**
 * Error responses shared by every endpoint, applied after the handlers of each feature. Messages
 * are translated to the request's language by {@code TranslatedMessageAdvice}.
 */
@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * @param exception invalid field
     * @return 400 with the message and the field name, so the frontend can show it next to the
     *     field
     */
    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage(), exception.getField()));
    }

    /**
     * @param exception bean validation errors of the body
     * @return 400 with the distinct error messages
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponse> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(". "));
        return ResponseEntity.badRequest().body(new MessageResponse(message.isBlank() ? "The submitted data is not valid." : message));
    }

    /**
     * @param exception a request parameter outside its limits, for example a page size above the
     *     maximum, in a controller annotated with {@code @Validated}
     * @return 400 with each parameter and why it is not valid, instead of a 500
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<MessageResponse> handleConstraintViolation(ConstraintViolationException exception) {
        String message = exception.getConstraintViolations().stream()
                .map(violation -> parameterName(violation.getPropertyPath().toString()) + ": " + violation.getMessage())
                .distinct()
                .collect(Collectors.joining(". "));
        return ResponseEntity.badRequest().body(new MessageResponse(message.isBlank() ? "The submitted data is not valid." : message));
    }

    /**
     * @param exception a request parameter outside its limits, validated by Spring MVC itself
     * @return 400 with the reasons, instead of a 500
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<MessageResponse> handleMethodValidation(HandlerMethodValidationException exception) {
        String message = exception.getAllErrors().stream()
                .map(error -> error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(". "));
        return ResponseEntity.badRequest().body(new MessageResponse(message.isBlank() ? "The submitted data is not valid." : message));
    }

    /**
     * @param propertyPath path of a violation, such as {@code getAllUsers.size}
     * @return only the parameter's name, such as {@code size}
     */
    private static String parameterName(String propertyPath) {
        return propertyPath.substring(propertyPath.lastIndexOf('.') + 1);
    }

    /**
     * @param exception invalid data
     * @return 400 with the message
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    /**
     * @param exception body that is not valid JSON or has wrong types
     * @return 400 with a generic message
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<MessageResponse> handleUnreadable(HttpMessageNotReadableException exception) {
        log.warn("Could not parse the request body: {}",
                exception.getMostSpecificCause().getMessage());
        return ResponseEntity.badRequest().body(new MessageResponse("The submitted data has an invalid format."));
    }

    /**
     * @param exception uploaded file too large
     * @return 413
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<MessageResponse> handleMaxUploadSize(MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(new MessageResponse("The file exceeds the maximum allowed size."));
    }

    /**
     * @param exception the requested record does not exist
     * @return 404 with the message
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<MessageResponse> handleEntityNotFound(EntityNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(exception.getMessage()));
    }

    /**
     * @param exception database constraint violated (duplicate or row still in use)
     * @return 409 with a generic message
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<MessageResponse> handleDataIntegrity(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new MessageResponse("A record with that data already exists or is being used by another item."));
    }
}
