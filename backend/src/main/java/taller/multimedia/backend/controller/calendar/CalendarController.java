package taller.multimedia.backend.controller.calendar;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.calendar.CalendarEventResponse;
import taller.multimedia.backend.service.calendar.CalendarEventService;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {
    private final CalendarEventService calendarEventService;

    @GetMapping("/events")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<CalendarEventResponse>> getEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango de fechas no es válido");
        }
        if (ChronoUnit.DAYS.between(from, to) > 31) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El rango máximo es de 31 días");
        }
        return ResponseEntity.ok(calendarEventService.getPlatformEvents(from, to));
    }
}
