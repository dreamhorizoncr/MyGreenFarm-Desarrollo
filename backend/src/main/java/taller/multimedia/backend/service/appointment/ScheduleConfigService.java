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

@Service
public class ScheduleConfigService {

    @Autowired
    private WeeklyScheduleRepository weeklyRepo;

    @Autowired
    private ScheduleExceptionRepository exceptionRepo;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // Obtener los horarios disponibles en bloques de 60 minutos para una fecha dada
    public List<LocalTime> getAvailableSlotsForDate(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        Optional<ScheduleException> exceptionOpt = exceptionRepo.findByExceptionDate(date);

        LocalTime startTime;
        LocalTime endTime;

        if (exceptionOpt.isPresent()) {
            ScheduleException exception = exceptionOpt.get();
            if (exception.isClosed()) {
                return new ArrayList<>(); // Día completamente cerrado por excepción
            }
            startTime = exception.getStartTime();
            endTime = exception.getEndTime();
        } else {
            // Si no hay excepción, buscar regla semanal regular
            Optional<WeeklySchedule> scheduleOpt = weeklyRepo.findByDayOfWeek(dayOfWeek);
            if (scheduleOpt.isEmpty() || !scheduleOpt.get().isActive()) {
                return new ArrayList<>(); // El día no labora por defecto
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
        
        List<Appointment> existingAppointments = appointmentRepository.findByAppointmentDateBetween(startOfDay, endOfDay);
        
        // Obtiene los intervalos de las citas activas (PENDING o CONFIRMED)
        List<LocalDateTime> bookedAppointmentStarts = existingAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
            .map(Appointment::getAppointmentDate)
                .toList();

        // Oculta cualquier bloque de una hora que se cruce con una cita activa.
        slots.removeIf(slot -> {
            LocalDateTime slotStart = date.atTime(slot);
            LocalDateTime slotEnd = slotStart.plusHours(1);
            return bookedAppointmentStarts.stream().anyMatch(appointmentStart ->
                slotStart.isBefore(appointmentStart.plusHours(1))
                    && slotEnd.isAfter(appointmentStart));
        });

        return slots;
    }

 // Incluye el nombre del evento especial para que la reserva pueda informarlo al cliente.
public Map<String, AvailableDayResponse> getAvailableSlotsForWeek(LocalDate startDate) {
    //  la semana nunca empieza antes de mañana
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    LocalDate effectiveStart = startDate.isBefore(tomorrow) ? tomorrow : startDate;

    //el tipo de retorno con AvailableDayResponse
    Map<String, AvailableDayResponse> weekSlots = new java.util.LinkedHashMap<>();

    for (int i = 0; i < 7; i++) {
        LocalDate currentDay = effectiveStart.plusDays(i);   // <- usa effectiveStart
        Optional<ScheduleException> exceptionOpt = exceptionRepo.findByExceptionDate(currentDay);
        boolean specialDay = exceptionOpt.isPresent();
        String eventName = specialDay ? exceptionOpt.get().getReason() : null;
        List<LocalTime> slots;

        // Fin de semana (hoy y días pasados ya no pueden aparecer gracias a effectiveStart)
        if (currentDay.getDayOfWeek().getValue() >= 6) {
            slots = List.of();
        } else {
                slots = getAvailableSlotsForDate(currentDay);
            }
            weekSlots.put(currentDay.toString(), new AvailableDayResponse(slots, specialDay, eventName));
        }

        return weekSlots;
    }

    // Con este método se crea un día con hora, si ya tenia, se edita
    public WeeklySchedule saveWeeklySchedule(WeeklySchedule schedule) {
        Optional<WeeklySchedule> existingOpt = weeklyRepo.findByDayOfWeek(schedule.getDayOfWeek());

        if (existingOpt.isPresent()) {
            // Si ya existe, actualizamos sus campos en lugar de insertar uno nuevo
            WeeklySchedule existing = existingOpt.get();
            existing.setStartTime(schedule.getStartTime());
            existing.setEndTime(schedule.getEndTime());
            existing.setActive(schedule.isActive());
            return weeklyRepo.save(existing);
        } else {
            // Si no existe, lo creamos normalmente
            return weeklyRepo.save(schedule);
        }
    }

    public ScheduleException saveException(ScheduleException exception) {
        return exceptionRepo.save(exception);
    }

    public void deleteException(Long id) {
        exceptionRepo.deleteById(id);
    }

    // Obtiene todas las reglas semanales para el panel de la dueña
    public List<WeeklySchedule> getAllWeeklySchedules() {
        return weeklyRepo.findAll();
    }

    // Obtiene todas las excepciones registradas
    public List<ScheduleException> getAllExceptions() {
        return exceptionRepo.findAll();
    }
}
