package taller.multimedia.backend.dto.appointment;

import java.time.LocalTime;
import java.util.List;

public record AvailableDayResponse(
        List<LocalTime> slots,
        boolean specialDay,
        String eventName) {
}
