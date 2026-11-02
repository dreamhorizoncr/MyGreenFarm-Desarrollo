package taller.multimedia.backend.service.calendar;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.calendar.CalendarEventResponse;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.user.UserRepository;

@Service
@RequiredArgsConstructor
public class CalendarEventService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    public List<CalendarEventResponse> getPlatformEvents(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<CalendarEventResponse> events = new ArrayList<>();

        appointmentRepository
                .findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(start, end)
                .stream()
                .filter(appointment -> appointment.getStatus() == AppointmentStatus.PENDING
                        || appointment.getStatus() == AppointmentStatus.CONFIRMED)
                .map(this::toAppointmentResponse)
                .forEach(events::add);

        userRepository.findByRole(Role.TEACHER).stream()
                .filter(user -> user.getBirthday() != null)
                .flatMap(user -> birthdayEvents(user, from, to).stream())
                .forEach(events::add);

        return events.stream()
                .sorted(Comparator.comparing(CalendarEventResponse::start))
                .toList();
    }

    private CalendarEventResponse toAppointmentResponse(Appointment appointment) {
        LocalDateTime start = appointment.getAppointmentDate();
        LocalDateTime end = start.plusHours(1);
        return new CalendarEventResponse(
                "appointment-" + appointment.getId(),
                "Cita: " + appointment.getChildName(),
                start.toString(),
                end.toString(),
                start.toLocalDate().toString(),
                "APPOINTMENT",
                false);
    }

    private List<CalendarEventResponse> birthdayEvents(User user, LocalDate from, LocalDate to) {
        List<CalendarEventResponse> events = new ArrayList<>();
        for (int year = from.getYear(); year <= to.getYear(); year++) {
            LocalDate birthday;
            try {
                birthday = user.getBirthday().withYear(year);
            } catch (java.time.DateTimeException exception) {
                continue;
            }
            if (!birthday.isBefore(from) && !birthday.isAfter(to)) {
                events.add(new CalendarEventResponse(
                        "birthday-" + user.getId() + "-" + birthday,
                        "Cumpleaños: " + user.getFirstName() + " " + user.getLastName(),
                        birthday.toString(),
                        birthday.plusDays(1).toString(),
                        birthday.toString(),
                        "BIRTHDAY",
                        true));
            }
        }
        return events;
    }
}
