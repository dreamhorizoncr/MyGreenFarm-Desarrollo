package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SlotHoldRequest {

    @NotNull(message = "El horario es obligatorio")
    @Future(message = "El horario debe ser en el futuro")
    private LocalDateTime slot;

    @NotBlank(message = "El identificador de la reserva es obligatorio")
    @Size(max = 64)
    private String holderId;
}
