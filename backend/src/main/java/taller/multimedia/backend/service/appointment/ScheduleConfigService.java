package taller.multimedia.backend.service.appointment;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import taller.multimedia.backend.dto.appointment.AvailableDayResponse;
import taller.multimedia.backend.model.appointment.ScheduleException;
import taller.multimedia.backend.model.appointment.WeeklySchedule;
import taller.multimedia.backend.repository.appointment.ScheduleExceptionRepository;
import taller.multimedia.backend.repository.appointment.WeeklyScheduleRepository;

@Service 
public class ScheduleConfigService {

    @Autowired 
    private WeeklyScheduleRepository weeklyRepo;

    @Autowired
    private ScheduleExceptionRepository exceptionRepo;

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

        return slots;
    }

    // Incluye el nombre del evento especial para que la reserva pueda informarlo al cliente.
    public Map<String, AvailableDayResponse> getAvailableSlotsForWeek(LocalDate startDate) {
        LocalDate today = LocalDate.now();
        Map<String, AvailableDayResponse> weekSlots = new java.util.LinkedHashMap<>();

        for (int i = 0; i < 7; i++) {
            LocalDate currentDay = startDate.plusDays(i);
            Optional<ScheduleException> exceptionOpt = exceptionRepo.findByExceptionDate(currentDay);
            boolean specialDay = exceptionOpt.isPresent();
            String eventName = specialDay ? exceptionOpt.get().getReason() : null;
            List<LocalTime> slots;

            // Si es hoy, pasado o fin de semana, devolvemos lista vacía
            if (!currentDay.isAfter(today) || currentDay.getDayOfWeek().getValue() >= 6) {
                slots = List.of();
            } else {
                slots = getAvailableSlotsForDate(currentDay);
            }
            weekSlots.put(currentDay.toString(), new AvailableDayResponse(slots, specialDay, eventName));
        }
        
        return weekSlots;
    }

    //Con este método se crea un día con hora, si ya tenia, se edita
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
