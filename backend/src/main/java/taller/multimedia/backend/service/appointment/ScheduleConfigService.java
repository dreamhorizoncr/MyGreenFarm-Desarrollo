package taller.multimedia.backend.service.appointment;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import taller.multimedia.backend.dto.appointment.AvailableDayResponse;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.appointment.ScheduleException;
import taller.multimedia.backend.model.appointment.WeeklySchedule;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.appointment.ScheduleExceptionRepository;
import taller.multimedia.backend.repository.appointment.WeeklyScheduleRepository;
import taller.multimedia.backend.util.Sanitizer;

/**
 * Opening hours for appointments: the regular weekly schedule plus exceptions for specific dates
 * (holidays or special hours). Appointments last one hour and start on the hour from the opening
 * time.
 */
@Service
@RequiredArgsConstructor
public class ScheduleConfigService {

    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final ScheduleExceptionRepository scheduleExceptionRepository;
    private final AppointmentRepository appointmentRepository;

    /**
     * Calculates the free one-hour slots of a day.
     *
     * <p>An exception for the date replaces the weekly schedule; a closed exception or an inactive
     * weekday leaves no slots. Slots that overlap a pending or confirmed appointment are removed.
     *
     * @param date day to check
     * @return start times of the free slots, in order
     */
    public List<LocalTime> getAvailableSlotsForDate(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        Optional<ScheduleException> scheduledException = scheduleExceptionRepository.findByExceptionDate(date);

        LocalTime startTime;
        LocalTime endTime;

        if (scheduledException.isPresent()) {
            ScheduleException exception = scheduledException.get();
            if (exception.isClosed()) {
                return new ArrayList<>();
            }
            startTime = exception.getStartTime();
            endTime = exception.getEndTime();
        } else {
            Optional<WeeklySchedule> weeklySchedule = weeklyScheduleRepository.findByDayOfWeek(dayOfWeek);
            if (weeklySchedule.isEmpty() || !weeklySchedule.get().isActive()) {
                return new ArrayList<>();
            }
            WeeklySchedule regular = weeklySchedule.get();
            startTime = regular.getStartTime();
            endTime = regular.getEndTime();
        }

        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = startTime;

        while (current.plusMinutes(59).isBefore(endTime) || current.plusMinutes(59).equals(endTime)) {
            slots.add(current);
            current = current.plusHours(1);
        }

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<Appointment> existingAppointments = appointmentRepository.findByAppointmentDateBetween(startOfDay,
                endOfDay);

        List<LocalDateTime> bookedAppointmentStarts = existingAppointments.stream()
                .filter(appointment -> appointment.getStatus() == AppointmentStatus.PENDING || appointment.getStatus() == AppointmentStatus.CONFIRMED)
                .map(Appointment::getAppointmentDate)
                .toList();

        slots.removeIf(slot -> {
            LocalDateTime slotStart = date.atTime(slot);
            LocalDateTime slotEnd = slotStart.plusHours(1);
            return bookedAppointmentStarts.stream()
                    .anyMatch(appointmentStart -> slotStart.isBefore(appointmentStart.plusHours(1))
                            && slotEnd.isAfter(appointmentStart));
        });

        return slots;
    }

    /**
     * Free slots for seven consecutive days, never starting before tomorrow. Saturdays and Sundays
     * have no slots.
     *
     * @param startDate first day requested
     * @return slots by date ({@code yyyy-MM-dd}), with whether the day has an exception and its
     *     reason
     */
    public Map<String, AvailableDayResponse> getAvailableSlotsForWeek(LocalDate startDate) {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate effectiveStart = startDate.isBefore(tomorrow) ? tomorrow : startDate;

        Map<String, AvailableDayResponse> weekSlots = new LinkedHashMap<>();

        for (int i = 0; i < 7; i++) {
            LocalDate currentDay = effectiveStart.plusDays(i); 
            Optional<ScheduleException> scheduledException = scheduleExceptionRepository.findByExceptionDate(currentDay);
            boolean specialDay = scheduledException.isPresent();
            String eventName = specialDay ? scheduledException.get().getReason() : null;
            List<LocalTime> slots;

            if (currentDay.getDayOfWeek().getValue() >= 6) {
                slots = List.of();
            } else {
                slots = getAvailableSlotsForDate(currentDay);
            }
            weekSlots.put(currentDay.toString(), new AvailableDayResponse(slots, specialDay, eventName));
        }

        return weekSlots;
    }

    /**
     * Creates or replaces the schedule of a weekday.
     *
     * @param schedule weekday, opening and closing times and whether it is active
     * @return the saved schedule
     */
    public WeeklySchedule saveWeeklySchedule(WeeklySchedule schedule) {
        Optional<WeeklySchedule> existingSchedule = weeklyScheduleRepository.findByDayOfWeek(schedule.getDayOfWeek());

        if (existingSchedule.isPresent()) {
            WeeklySchedule existing = existingSchedule.get();
            existing.setStartTime(schedule.getStartTime());
            existing.setEndTime(schedule.getEndTime());
            existing.setActive(schedule.isActive());
            return weeklyScheduleRepository.save(existing);
        } else {
            return weeklyScheduleRepository.save(schedule);
        }
    }

    /**
     * @param exception date, special hours or closed flag, and an optional reason (sanitized)
     * @return the saved exception
     * @throws taller.multimedia.backend.exception.InvalidFieldException if the reason is unsafe
     */
    public ScheduleException saveException(ScheduleException exception) {
        if (exception.getReason() != null) {
            exception.setReason(Sanitizer.requireClean("reason", exception.getReason()));
        }
        return scheduleExceptionRepository.save(exception);
    }

    /**
     * @param id exception to delete
     */
    public void deleteException(Long id) {
        scheduleExceptionRepository.deleteById(id);
    }

    /**
     * @return the schedule of every configured weekday
     */
    public List<WeeklySchedule> getAllWeeklySchedules() {
        return weeklyScheduleRepository.findAll();
    }

    /**
     * @return all date exceptions
     */
    public List<ScheduleException> getAllExceptions() {
        return scheduleExceptionRepository.findAll();
    }
}
