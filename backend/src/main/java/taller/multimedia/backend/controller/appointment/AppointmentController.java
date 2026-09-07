package taller.multimedia.backend.controller.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
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

import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.service.appointment.AppointmentService;
import taller.multimedia.backend.service.appointment.GoogleCalendarService;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private GoogleCalendarService googleCalendarService;
    
    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody AppointmentRequest requestDTO) {
        Appointment newAppointment = appointmentService.createAppointment(requestDTO);
        return ResponseEntity.ok(newAppointment);
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
            List<String> freeSlots = googleCalendarService.getAvailableSlots(date);
            return ResponseEntity.ok(freeSlots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al consultar el calendario: " + e.getMessage());
        }
    }

    @GetMapping("/available-week")
    public ResponseEntity<?> getAvailableWeek(@RequestParam("date") String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr);
            Map<String, List<String>> weekSlots = googleCalendarService.getAvailableSlotsForWeek(date);
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
        
        Appointment updatedAppointment = appointmentService.rescheduleAppointment(id, newDate, lang);
        return ResponseEntity.ok(updatedAppointment);
    }
}