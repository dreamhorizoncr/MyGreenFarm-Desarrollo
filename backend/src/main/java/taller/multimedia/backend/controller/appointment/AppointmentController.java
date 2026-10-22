package taller.multimedia.backend.controller.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.dto.appointment.AvailableDayResponse;
import taller.multimedia.backend.dto.appointment.SlotHoldRequest;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.service.appointment.AppointmentService;
import taller.multimedia.backend.service.appointment.ScheduleConfigService;
import taller.multimedia.backend.service.appointment.SlotEventService;
import taller.multimedia.backend.service.appointment.SlotHoldService;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private ScheduleConfigService scheduleConfigService;

    @Autowired
    private SlotHoldService slotHoldService;

    @Autowired
    private SlotEventService slotEventService;

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@Valid @RequestBody AppointmentRequest requestDTO) {
        Appointment newAppointment = slotHoldService.bookExclusively(
                requestDTO.getAppointmentDate(),
                requestDTO.getHoldId(),
                () -> appointmentService.createAppointment(requestDTO));
        return ResponseEntity.ok(newAppointment);
    }

    // Aparta el horario mientras la persona termina el formulario; repetirlo renueva el tiempo
    @PostMapping("/holds")
    public ResponseEntity<SlotHoldService.HoldResult> holdSlot(
            @Valid @RequestBody SlotHoldRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(slotHoldService.hold(request.getSlot(), request.getHolderId(), clientKey(httpRequest)));
    }

    // Por POST con parámetro para poder llamarlo con navigator.sendBeacon al cerrar la página
    @PostMapping("/holds/release")
    public ResponseEntity<Void> releaseSlot(@RequestParam String holderId) {
        slotHoldService.release(holderId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(path = "/holds/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSlotEvents() {
        return slotEventService.subscribe(slotHoldService.heldSlots());
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable UUID id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(appointment);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status,
            @RequestParam(required = false) String conclusion,
            @RequestParam(required = false, defaultValue = "es") String lang) {

        Appointment updated = appointmentService.updateAppointmentStatus(id, status, conclusion, lang);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/available-slots")
    public ResponseEntity<?> getAvailableSlots(@RequestParam("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            List<LocalTime> freeSlots = scheduleConfigService.getAvailableSlotsForDate(date);
            return ResponseEntity.ok(freeSlots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al consultar los horarios: " + e.getMessage());
        }
    }

    @GetMapping("/available-week")
    public ResponseEntity<?> getAvailableWeek(@RequestParam("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            Map<String, AvailableDayResponse> weekSlots = scheduleConfigService.getAvailableSlotsForWeek(date);
            return ResponseEntity.ok(weekSlots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al consultar la semana: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable UUID id,
            @RequestParam LocalDateTime newDate,
            @RequestParam(required = false, defaultValue = "es") String lang) {

        Appointment updatedAppointment = slotHoldService.bookExclusively(
                newDate, null, () -> appointmentService.rescheduleAppointment(id, newDate, lang));
        return ResponseEntity.ok(updatedAppointment);
    }

    @GetMapping("/test-reminders")
    public ResponseEntity<String> testReminders() {
        appointmentService.send24HourReminders();
        return ResponseEntity.ok("Tarea de recordatorios ejecutada manualmente.");
    }
}
