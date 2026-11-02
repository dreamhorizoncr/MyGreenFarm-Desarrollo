package taller.multimedia.backend.dto.calendar;

public record CalendarEventResponse(
        String id,
        String title,
        String start,
        String end,
        String date,
        String type,
        boolean allDay) {
}
