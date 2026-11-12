package taller.multimedia.backend.dto.dashboard;

import java.util.List;

/**
 * Dashboard of a teacher: only what their sidebar unlocks (their groups, the children in them,
 * expedients and evaluations, and their forum articles).
 */
public record TeacherDashboardResponse(
        List<Group> groups,
        long childrenCount,
        long articleCount,
        /* All pending tasks; priorities holds only the first six. */
        int pendingCount,
        List<DashboardPriorityResponse> priorities,
        List<DashboardActivityResponse> activities) {

    public record Group(Long id, String name, int childCount) {
    }
}
