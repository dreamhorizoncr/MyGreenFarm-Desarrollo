package taller.multimedia.backend.controller.appointment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import taller.multimedia.backend.model.appointment.ScheduleException;
import taller.multimedia.backend.model.appointment.WeeklySchedule;
import taller.multimedia.backend.service.appointment.ScheduleConfigService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/schedule")
public class ScheduleConfigController {

    @Autowired
    private ScheduleConfigService scheduleService;

    // Obtiene los slots disponibles para una fecha que consulta un cliente
    @GetMapping("/slots")
    public ResponseEntity<List<LocalTime>> getSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<LocalTime> slots = scheduleService.getAvailableSlotsForDate(date);
        return ResponseEntity.ok(slots);
    }

    // Guarda o actualiza regla de un día de la semana
    @PostMapping("/weekly")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<WeeklySchedule> saveWeekly(@RequestBody WeeklySchedule schedule) {
        WeeklySchedule saved = scheduleService.saveWeeklySchedule(schedule);
        return ResponseEntity.ok(saved);
    }

    // Crea una excepción (ej: cerrar un día específico o cambiar hora por
    // imprevisto)
    @PostMapping("/exceptions")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ScheduleException> saveException(@RequestBody ScheduleException exception) {
        ScheduleException saved = scheduleService.saveException(exception);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/exceptions/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<Void> deleteException(@PathVariable Long id) {
        scheduleService.deleteException(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/weekly")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<List<WeeklySchedule>> getAllWeeklySchedules() {
        List<WeeklySchedule> schedules = scheduleService.getAllWeeklySchedules();
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/exceptions")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<List<ScheduleException>> getAllExceptions() {
        List<ScheduleException> exceptions = scheduleService.getAllExceptions();
        return ResponseEntity.ok(exceptions);
    }

    public Map<String, List<LocalTime>> getAvailableSlotsForWeek(LocalDate startDate) {
        LocalDate today = LocalDate.now();
        Map<String, List<LocalTime>> weekSlots = new java.util.LinkedHashMap<>();

        for (int i = 0; i < 7; i++) {
            LocalDate currentDay = startDate.plusDays(i);

            // Si es hoy, pasado o fin de semana, devolvemos lista vacía
            if (!currentDay.isAfter(today) || currentDay.getDayOfWeek().getValue() >= 6) {
                weekSlots.put(currentDay.toString(), List.of());
            } else {
                // Reutilizamos tu método existente para calcular los slots del día
                List<LocalTime> slotsForDay = scheduleService.getAvailableSlotsForDate(currentDay);
                weekSlots.put(currentDay.toString(), slotsForDay);
            }
        }

        return weekSlots;
    }
}
