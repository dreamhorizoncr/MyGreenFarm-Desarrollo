package taller.multimedia.backend.controller.calendar;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<CalendarEventResponse>> getEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        if (to.isBefore(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The date range is not valid");
        }
        if (ChronoUnit.DAYS.between(from, to) > 31) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The maximum range is 31 days");
        }
        boolean isTeacher = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_TEACHER".equals(authority.getAuthority()));
        if (isTeacher) {
            return ResponseEntity.ok(calendarEventService.getTeacherEvents(authentication.getName(), from, to));
        }
        return ResponseEntity.ok(calendarEventService.getPlatformEvents(from, to));
    }
}
