package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SlotHoldRequest {

    @NotNull(message = "The schedule is required")
    @Future(message = "The time slot must be in the future")
    private LocalDateTime slot;

    @NotBlank(message = "The reservation ID is required")
    @Size(max = 64)
    private String holderId;
}
