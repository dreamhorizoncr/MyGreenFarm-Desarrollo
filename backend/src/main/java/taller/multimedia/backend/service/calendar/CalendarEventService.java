package taller.multimedia.backend.service.calendar;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.calendar.CalendarEventResponse;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.child.Child;
import taller.multimedia.backend.model.group.ChildGroup;
import taller.multimedia.backend.model.user.Role;
import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.group.GroupRepository;
import taller.multimedia.backend.repository.user.UserRepository;

@Service
@RequiredArgsConstructor
public class CalendarEventService {
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getTeacherEvents(String email, LocalDate from, LocalDate to) {
        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<CalendarEventResponse> events = new ArrayList<>();

        userRepository.findByRole(Role.TEACHER).stream()
                .filter(user -> user.getBirthday() != null)
                .flatMap(user -> birthdayEvents(user, from, to).stream())
                .forEach(events::add);

        Map<Long, Child> children = new LinkedHashMap<>();
        groupRepository.findByTeacherId(teacher.getId()).stream()
                .flatMap(group -> group.getChildGroups().stream())
                .map(ChildGroup::getChild)
                .filter(child -> child != null && Boolean.TRUE.equals(child.getIsActive()) && child.getBirthDate() != null)
                .forEach(child -> children.putIfAbsent(child.getId(), child));
        children.values().forEach(child -> events.addAll(birthdayEvents(
                "child-" + child.getId(), child.getBirthDate(), child.getFirstName() + " " + child.getLastName(), from, to)));

        return events.stream()
                .sorted(Comparator.comparing(CalendarEventResponse::start))
                .toList();
    }

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
        return birthdayEvents(String.valueOf(user.getId()), user.getBirthday(),
                user.getFirstName() + " " + user.getLastName(), from, to);
    }

    private List<CalendarEventResponse> birthdayEvents(String key, LocalDate birthDate, String name,
            LocalDate from, LocalDate to) {
        List<CalendarEventResponse> events = new ArrayList<>();
        for (int year = from.getYear(); year <= to.getYear(); year++) {
            LocalDate birthday;
            try {
                birthday = birthDate.withYear(year);
            } catch (java.time.DateTimeException exception) {
                continue;
            }
            if (!birthday.isBefore(from) && !birthday.isAfter(to)) {
                events.add(new CalendarEventResponse(
                        "birthday-" + key + "-" + birthday,
                        "Cumpleaños: " + name.trim(),
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
