package taller.multimedia.backend.dto.curriculum;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class ApplicationRequest {

    // Nula cuando es una postulación espontánea (sin vacante asociada)
    private UUID vacancyId;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar los 150 caracteres")
    private String applicantName;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El formato del correo electrónico no es válido")
    private String applicantEmail;

    private String applicantPhone;
}
