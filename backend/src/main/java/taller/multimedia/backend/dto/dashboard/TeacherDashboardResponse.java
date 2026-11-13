package taller.multimedia.backend.dto.dashboard;

import java.util.List;

public record TeacherDashboardResponse(
        List<Group> groups,
        long childrenCount,
        long articleCount,
        int pendingCount,
        List<DashboardPriorityResponse> priorities,
        List<DashboardActivityResponse> activities,
        String aiSummary) {

    public record Group(Long id, String name, int childCount) {
    }
}
