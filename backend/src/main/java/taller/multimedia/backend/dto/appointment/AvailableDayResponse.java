package taller.multimedia.backend.dto.appointment;

import java.time.LocalTime;
import java.util.List;

/**
 * Free appointment slots of one day.
 *
 * @param slots start times of the free slots
 * @param specialDay whether the day has a schedule exception
 * @param eventName reason of the exception, for example a holiday, or {@code null}
 */
public record AvailableDayResponse(
        List<LocalTime> slots,
        boolean specialDay,
        String eventName) {
}
