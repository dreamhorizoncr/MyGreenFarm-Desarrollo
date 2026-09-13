package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AppointmentRequest {

    @NotBlank(message = "El tipo de identificación es obligatorio")
    private String idType;

    @NotBlank(message = "La identificación es obligatoria")
    private String parentIdentification;

    @NotBlank(message = "El nombre del padre o tutor es obligatorio")
    @Size(min = 2, max = 150)
    private String parentName;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato del correo electrónico no es válido")
    @Size(max = 255, message = "El nombre debe tener como máximo 150 caracteres")
    private String parentEmail;

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(min = 8, max = 35, message = "El teléfono debe tener como máximo 35 caracteres")
    private String parentPhone;

    @NotBlank(message = "La ocupación es obligatoria")
    @Size(max = 150, message = "La ocupación debe tener como máximo 150 caracteres")
    private String parentOccupation;

    @NotBlank(message = "El nombre del niño o niña es obligatorio")
    @Size(max = 150, message = "El nombre del niño debe tener como máximo 150 caracteres")
    private String childName;

    @NotNull(message = "La fecha de la cita es obligatoria")
    @Future(message = "La fecha de la cita debe ser en el futuro")
    private LocalDateTime appointmentDate;

    @Size(max = 2000, message = "El motivo debe tener como máximo 2000 caracteres")
    @NotBlank(message = "El motivo o datos extras son obligatorios")
    private String parentNotes;

    private String language;
}
