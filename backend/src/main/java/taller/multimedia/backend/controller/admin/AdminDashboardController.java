package taller.multimedia.backend.controller.admin;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.dashboard.DashboardSummaryResponse;
import taller.multimedia.backend.dto.dashboard.TeacherDashboardResponse;
import taller.multimedia.backend.service.dashboard.DashboardService;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public DashboardSummaryResponse getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "lang", required = false) String lang,
            @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, required = false) String acceptLanguage,
            Authentication authentication) {
        boolean isOwner = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_OWNER".equals(authority.getAuthority()));
        return dashboardService.getSummary(date, isOwner, resolveLanguage(lang, acceptLanguage));
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public TeacherDashboardResponse getTeacherSummary(
            @RequestParam(name = "lang", required = false) String lang,
            @RequestHeader(value = HttpHeaders.ACCEPT_LANGUAGE, required = false) String acceptLanguage,
            Authentication authentication) {
        return dashboardService.getTeacherSummary(
                authentication.getName(), resolveLanguage(lang, acceptLanguage));
    }

    private static String resolveLanguage(String lang, String acceptLanguage) {
        String requested = lang == null || lang.isBlank() ? acceptLanguage : lang;
        if (requested == null || requested.isBlank()) {
            return "es";
        }
        String normalized = requested.split(",", 2)[0].split("[-_]", 2)[0].trim().toLowerCase();
        return normalized.equals("en") || normalized.equals("fr") ? normalized : "es";
    }
}
