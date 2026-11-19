package taller.multimedia.backend.controller.appointment;

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

/**
 * Opening hours for appointments. Changes are for the owner.
 */
@RestController
@RequestMapping("/api/admin/schedule")
public class ScheduleConfigController {

    private final ScheduleConfigService scheduleConfigService;

    public ScheduleConfigController(ScheduleConfigService scheduleConfigService) {
        this.scheduleConfigService = scheduleConfigService;
    }

    /**
     * {@code GET /api/admin/schedule/slots}
     *
     * @param date day to check
     * @return start times of the free slots of that day
     */
    @GetMapping("/slots")
    public ResponseEntity<List<LocalTime>> getSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<LocalTime> slots = scheduleConfigService.getAvailableSlotsForDate(date);
        return ResponseEntity.ok(slots);
    }

    /**
     * {@code POST /api/admin/schedule/weekly}: creates or replaces the schedule of a weekday.
     *
     * @param schedule weekday, opening and closing times and whether it is active
     * @return the saved schedule
     */
    @PostMapping("/weekly")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<WeeklySchedule> saveWeekly(@RequestBody WeeklySchedule schedule) {
        WeeklySchedule saved = scheduleConfigService.saveWeeklySchedule(schedule);
        return ResponseEntity.ok(saved);
    }

    /**
     * {@code POST /api/admin/schedule/exceptions}: special hours or a closed day for a date.
     *
     * @param exception date, hours or closed flag, and reason
     * @return the saved exception
     */
    @PostMapping("/exceptions")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<ScheduleException> saveException(@RequestBody ScheduleException exception) {
        ScheduleException saved = scheduleConfigService.saveException(exception);
        return ResponseEntity.ok(saved);
    }

    /**
     * {@code DELETE /api/admin/schedule/exceptions/{id}}
     *
     * @param id exception ID
     * @return 204
     */
    @DeleteMapping("/exceptions/{id}")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<Void> deleteException(@PathVariable Long id) {
        scheduleConfigService.deleteException(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/admin/schedule/weekly}
     *
     * @return the schedule of every configured weekday
     */
    @GetMapping("/weekly")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<List<WeeklySchedule>> getAllWeeklySchedules() {
        List<WeeklySchedule> schedules = scheduleConfigService.getAllWeeklySchedules();
        return ResponseEntity.ok(schedules);
    }

    /**
     * {@code GET /api/admin/schedule/exceptions}
     *
     * @return all date exceptions
     */
    @GetMapping("/exceptions")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<List<ScheduleException>> getAllExceptions() {
        List<ScheduleException> exceptions = scheduleConfigService.getAllExceptions();
        return ResponseEntity.ok(exceptions);
    }
}
