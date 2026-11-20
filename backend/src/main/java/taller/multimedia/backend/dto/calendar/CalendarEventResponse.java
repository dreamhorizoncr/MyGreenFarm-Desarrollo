package taller.multimedia.backend.dto.calendar;

/**
 * An event of the dashboard calendar.
 *
 * @param id unique ID, for example {@code appointment-<id>} or {@code birthday-<id>-<date>}
 * @param title text shown in the calendar
 * @param start start, as an ISO date or date-time
 * @param end end, exclusive
 * @param date day the event belongs to
 * @param type {@code APPOINTMENT} or {@code BIRTHDAY}
 * @param allDay whether it lasts the whole day
 */
public record CalendarEventResponse(
        String id,
        String title,
        String start,
        String end,
        String date,
        String type,
        boolean allDay) {
}
