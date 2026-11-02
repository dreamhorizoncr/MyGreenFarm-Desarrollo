package taller.multimedia.backend.service.calendar;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.google.api.services.calendar.model.Event;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.calendar.CalendarEventResponse;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.user.UserRepository;
import taller.multimedia.backend.service.appointment.GoogleCalendarService;

@Service
@RequiredArgsConstructor
public class CalendarEventService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final GoogleCalendarService googleCalendarService;

    public List<CalendarEventResponse> getPlatformEvents(LocalDate from, LocalDate to) {
        Set<String> appointmentIds = new HashSet<>(appointmentRepository.findAll().stream()
                .map(appointment -> appointment.getGoogleEventId())
                .filter(id -> id != null && !id.isBlank())
                .toList());
        Map<String, String> birthdayTitlesById = new HashMap<>();
        userRepository.findAll().forEach(user -> {
            if (user.getBirthdayEventId() != null && !user.getBirthdayEventId().isBlank()) {
                birthdayTitlesById.put(
                        user.getBirthdayEventId(),
                        "Cumpleaños: " + user.getFirstName() + " " + user.getLastName());
            }
        });

        return googleCalendarService.listEvents(from, to).stream()
                .map(event -> toResponse(event, appointmentIds, birthdayTitlesById))
                .filter(response -> response != null)
                .toList();
    }

    private CalendarEventResponse toResponse(
            Event event,
            Set<String> appointmentIds,
            Map<String, String> birthdayTitlesById) {
        if (appointmentIds.contains(event.getId())) {
            return googleCalendarService.toResponse(event, "APPOINTMENT", event.getSummary());
        }

        String recurringEventId = event.getRecurringEventId();
        String birthdayTitle = birthdayTitlesById.get(event.getId());
        if (birthdayTitle == null && recurringEventId != null) {
            birthdayTitle = birthdayTitlesById.get(recurringEventId);
        }
        if (birthdayTitle != null) {
            return googleCalendarService.toResponse(event, "BIRTHDAY", birthdayTitle);
        }

        return null;
    }
}
