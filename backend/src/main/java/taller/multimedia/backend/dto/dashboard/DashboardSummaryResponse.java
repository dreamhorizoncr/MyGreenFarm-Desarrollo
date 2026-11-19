package taller.multimedia.backend.dto.dashboard;

import java.util.List;

/**
 * Dashboard of the owner and admins.
 *
 * @param appointments appointments of the day
 * @param pendingAppointmentCount appointments waiting for confirmation
 * @param activeChildrenCount enrolled active children
 * @param activities recent content
 * @param priorities pending tasks
 * @param aiSummary AI summary of the day, or an empty string
 */
public record DashboardSummaryResponse(
        List<DashboardAppointmentResponse> appointments,
        long pendingAppointmentCount,
        long activeChildrenCount,
        List<DashboardActivityResponse> activities,
        List<DashboardPriorityResponse> priorities,
        String aiSummary) {
}
