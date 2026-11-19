package taller.multimedia.backend.controller.admin;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.dashboard.DashboardSummaryResponse;
import taller.multimedia.backend.dto.dashboard.TeacherDashboardResponse;
import taller.multimedia.backend.service.dashboard.DashboardService;

/**
 * Data of the admin panel's home page.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    /**
     * {@code GET /api/admin/dashboard}, owner and admins. Forum activity is only included for the
     * owner.
     *
     * @param date day to show
     * @param authentication current user
     * @return the day's dashboard
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public DashboardSummaryResponse getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        boolean isOwner = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_OWNER".equals(authority.getAuthority()));
        return dashboardService.getSummary(date, isOwner);
    }

    /**
     * {@code GET /api/admin/dashboard/teacher}, teachers only.
     *
     * @param authentication current teacher
     * @return the teacher's dashboard
     */
    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public TeacherDashboardResponse getTeacherSummary(Authentication authentication) {
        return dashboardService.getTeacherSummary(authentication.getName());
    }
}
