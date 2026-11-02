package taller.multimedia.backend.dto.dashboard;

import java.util.List;

public record DashboardSummaryResponse(
        List<DashboardAppointmentResponse> appointments,
        long pendingAppointmentCount,
        long activeChildrenCount) {
}
