package taller.multimedia.backend.controller.appointment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

@RestControllerAdvice(basePackageClasses = AppointmentController.class)
public class AppointmentExceptionHandler {

    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    // Datos de la cita que el servicio rechaza (p. ej. un correo de un proveedor no aceptado):
    // 400 con el motivo, para que el frontend pueda mostrarlo, en lugar de un 500 sin mensaje.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }
}
