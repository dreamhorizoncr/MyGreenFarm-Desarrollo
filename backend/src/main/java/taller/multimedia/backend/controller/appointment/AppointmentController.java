package taller.multimedia.backend.controller.appointment;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import taller.multimedia.backend.dto.appointment.AppointmentRequest;
import taller.multimedia.backend.dto.appointment.AppointmentResponse;
import taller.multimedia.backend.dto.appointment.AvailableDayResponse;
import taller.multimedia.backend.dto.appointment.SlotHoldRequest;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.service.appointment.AppointmentService;
import taller.multimedia.backend.service.appointment.ScheduleConfigService;
import taller.multimedia.backend.service.appointment.SlotEventService;
import taller.multimedia.backend.service.appointment.SlotHoldService;

/**
 * Visit appointments. Families book them without an account (holding a slot while they fill in the
 * form); managing them is for the owner and admins.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    private final AppointmentService appointmentService;
    private final ScheduleConfigService scheduleConfigService;
    private final SlotHoldService slotHoldService;
    private final SlotEventService slotEventService;

    public AppointmentController(AppointmentService appointmentService, ScheduleConfigService scheduleConfigService,
            SlotHoldService slotHoldService, SlotEventService slotEventService) {
        this.appointmentService = appointmentService;
        this.scheduleConfigService = scheduleConfigService;
        this.slotHoldService = slotHoldService;
        this.slotEventService = slotEventService;
    }

    /**
     * {@code POST /api/appointments}: books the appointment while no other booking of the same slot
     * can run.
     *
     * @param request family's data, the slot and the ID of the form's hold
     * @return 200 when the appointment was booked; 409 if the slot is no longer free
     */
    @PostMapping
    public ResponseEntity<Void> createAppointment(@Valid @RequestBody AppointmentRequest request) {
        slotHoldService.bookExclusively(
                request.getAppointmentDate(),
                request.getHoldId(),
                () -> appointmentService.createAppointment(request));
        return ResponseEntity.ok().build();
    }

    /**
     * {@code POST /api/appointments/holds}: holds a slot for ten minutes while the form is filled
     * in.
     *
     * @param request slot and the form's random ID
     * @param httpRequest request, to identify the client
     * @return the held slot and when the hold expires; 409 if it is not free
     */
    @PostMapping("/holds")
    public ResponseEntity<SlotHoldService.HoldResult> holdSlot(
            @Valid @RequestBody SlotHoldRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(slotHoldService.hold(request.getSlot(), request.getHolderId(), clientKey(httpRequest)));
    }

    /**
     * {@code POST /api/appointments/holds/release}: releases the slots held by a form, for example
     * when it is closed.
     *
     * @param holderId form's random ID
     * @return 204
     */
    @PostMapping("/holds/release")
    public ResponseEntity<Void> releaseSlot(@RequestParam String holderId) {
        slotHoldService.release(holderId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/appointments/holds/stream}: Server-Sent Events with the slots that are held,
     * released or booked, so the booking page updates live.
     *
     * @return the event stream
     */
    @GetMapping(path = "/holds/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSlotEvents() {
        return slotEventService.subscribe(slotHoldService.heldSlots());
    }

    /**
     * @param request incoming request
     * @return the client's address. Behind a proxy it is the last address of {@code X-Forwarded-For},
     *     the one added by the proxy itself; the first ones are sent by the client and could be forged
     *     to get around the per-client limit
     */
    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] addresses = forwarded.split(",");
            return addresses[addresses.length - 1].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * {@code GET /api/appointments}
     *
     * @param status status to filter by, optional
     * @param date day to filter by, optional
     * @param search text to look for in names, email and phone, optional
     * @param excludePast whether to hide past appointments, {@code true} by default
     * @param notBefore limit for past appointments, optional
     * @param pageable page and size
     * @return the matching appointments, sorted by date
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<Page<AppointmentResponse>> getAllAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean excludePast,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime notBefore,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(appointmentService.getAppointments(
                status, date, search, excludePast, notBefore, pageable));
    }

    /**
     * {@code GET /api/appointments/{id}}
     *
     * @param id appointment ID
     * @return the appointment
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable UUID id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(AppointmentResponse.from(appointment));
    }

    /**
     * {@code PATCH /api/appointments/{id}/status}
     *
     * @param id appointment ID
     * @param status new status
     * @param conclusion notes after the visit, optional
     * @param lang language for the email when the appointment has none
     * @return the updated appointment
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status,
            @RequestParam(required = false) String conclusion,
            @RequestParam(required = false, defaultValue = "es") String lang) {

        Appointment updated = appointmentService.updateAppointmentStatus(id, status, conclusion, lang);
        return ResponseEntity.ok(AppointmentResponse.from(updated));
    }

    /**
     * {@code GET /api/appointments/available-slots}, public.
     *
     * @param dateText day in {@code yyyy-MM-dd} format
     * @return start times of the free slots, or 400 if the date is not valid
     */
    @GetMapping("/available-slots")
    public ResponseEntity<?> getAvailableSlots(@RequestParam("date") String dateText) {
        try {
            LocalDate date = LocalDate.parse(dateText);
            List<LocalTime> freeSlots = scheduleConfigService.getAvailableSlotsForDate(date);
            return ResponseEntity.ok(freeSlots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching the time slots: " + e.getMessage());
        }
    }

    /**
     * {@code GET /api/appointments/available-week}, public.
     *
     * @param dateText first day in {@code yyyy-MM-dd} format
     * @return free slots of seven days starting no earlier than tomorrow, or 400 if the date is not
     *     valid
     */
    @GetMapping("/available-week")
    public ResponseEntity<?> getAvailableWeek(@RequestParam("date") String dateText) {
        try {
            LocalDate date = LocalDate.parse(dateText);
            Map<String, AvailableDayResponse> weekSlots = scheduleConfigService.getAvailableSlotsForWeek(date);
            return ResponseEntity.ok(weekSlots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching the week: " + e.getMessage());
        }
    }

    /**
     * {@code PATCH /api/appointments/{id}/reschedule}
     *
     * @param id appointment ID
     * @param newDate new slot
     * @param lang language for the email when the appointment has none
     * @return the updated appointment
     */
    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<AppointmentResponse> rescheduleAppointment(
            @PathVariable UUID id,
            @RequestParam LocalDateTime newDate,
            @RequestParam(required = false, defaultValue = "es") String lang) {

        Appointment updatedAppointment = slotHoldService.bookExclusively(
                newDate, null, () -> appointmentService.rescheduleAppointment(id, newDate, lang));
        return ResponseEntity.ok(AppointmentResponse.from(updatedAppointment));
    }

    /**
     * {@code POST /api/appointments/reminders/send}: sends now the reminders of the appointments
     * that start in 24 to 25 hours, without waiting for the hourly job.
     *
     * @return a confirmation message
     */
    @PostMapping("/reminders/send")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<String> sendRemindersNow() {
        appointmentService.send24HourReminders();
        return ResponseEntity.ok("Reminder task run manually.");
    }
}
