package taller.multimedia.backend.service.appointment;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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

@Service
public class ScheduleConfigService {

    @Autowired
    private WeeklyScheduleRepository weeklyRepo;

    @Autowired
    private ScheduleExceptionRepository exceptionRepo;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public List<LocalTime> getAvailableSlotsForDate(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        Optional<ScheduleException> exceptionOpt = exceptionRepo.findByExceptionDate(date);

        LocalTime startTime;
        LocalTime endTime;

        if (exceptionOpt.isPresent()) {
            ScheduleException exception = exceptionOpt.get();
            if (exception.isClosed()) {
                return new ArrayList<>();
            }
            startTime = exception.getStartTime();
            endTime = exception.getEndTime();
        } else {
            Optional<WeeklySchedule> scheduleOpt = weeklyRepo.findByDayOfWeek(dayOfWeek);
            if (scheduleOpt.isEmpty() || !scheduleOpt.get().isActive()) {
                return new ArrayList<>();
            }
            WeeklySchedule regular = scheduleOpt.get();
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
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
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

    public Map<String, AvailableDayResponse> getAvailableSlotsForWeek(LocalDate startDate) {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate effectiveStart = startDate.isBefore(tomorrow) ? tomorrow : startDate;

        Map<String, AvailableDayResponse> weekSlots = new java.util.LinkedHashMap<>();

        for (int i = 0; i < 7; i++) {
            LocalDate currentDay = effectiveStart.plusDays(i); 
            Optional<ScheduleException> exceptionOpt = exceptionRepo.findByExceptionDate(currentDay);
            boolean specialDay = exceptionOpt.isPresent();
            String eventName = specialDay ? exceptionOpt.get().getReason() : null;
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

    public WeeklySchedule saveWeeklySchedule(WeeklySchedule schedule) {
        Optional<WeeklySchedule> existingOpt = weeklyRepo.findByDayOfWeek(schedule.getDayOfWeek());

        if (existingOpt.isPresent()) {
            WeeklySchedule existing = existingOpt.get();
            existing.setStartTime(schedule.getStartTime());
            existing.setEndTime(schedule.getEndTime());
            existing.setActive(schedule.isActive());
            return weeklyRepo.save(existing);
        } else {
            return weeklyRepo.save(schedule);
        }
    }

    public ScheduleException saveException(ScheduleException exception) {
        if (exception.getReason() != null) {
            exception.setReason(Sanitizer.requireClean("reason", exception.getReason()));
        }
        return exceptionRepo.save(exception);
    }

    public void deleteException(Long id) {
        exceptionRepo.deleteById(id);
    }

    public List<WeeklySchedule> getAllWeeklySchedules() {
        return weeklyRepo.findAll();
    }

    public List<ScheduleException> getAllExceptions() {
        return exceptionRepo.findAll();
    }
}
