package taller.multimedia.backend.controller.admin;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.dashboard.DashboardSummaryResponse;
import taller.multimedia.backend.service.dashboard.DashboardService;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public DashboardSummaryResponse getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return dashboardService.getSummary(date);
    }
}
