package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentRequest {

    @NotBlank(message = "El tipo de identificación es obligatorio")
    private String idType;

    @NotBlank(message = "La identificación es obligatoria")
    private String parentIdentification;

    @NotBlank(message = "El nombre del padre o tutor es obligatorio")
    private String parentName;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato del correo electrónico no es válido")
    private String parentEmail;

    @NotBlank(message = "El teléfono es obligatorio")
    private String parentPhone;

    @NotBlank(message = "La ocupación es obligatoria")
    private String parentOccupation;

    @NotBlank(message = "El nombre del niño o niña es obligatorio")
    private String childName;

    @NotNull(message = "La fecha de la cita es obligatoria")
    @Future(message = "La fecha de la cita debe ser en el futuro")
    private LocalDateTime appointmentDate;

    @NotBlank(message = "El motivo o datos extras son obligatorios")
    private String parentNotes;

    private String language;
}
