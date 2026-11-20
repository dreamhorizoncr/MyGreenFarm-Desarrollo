package taller.multimedia.backend.dto.dashboard;

import java.util.List;

/**
 * Dashboard of a teacher.
 *
 * @param groups groups the teacher leads
 * @param childrenCount active children in those groups
 * @param articleCount forum articles the teacher wrote
 * @param pendingCount pending records and evaluations
 * @param priorities the first pending tasks
 * @param activities the teacher's latest forum articles
 * @param aiSummary AI summary of the teacher's day, or an empty string
 */
public record TeacherDashboardResponse(
        List<Group> groups,
        long childrenCount,
        long articleCount,
        int pendingCount,
        List<DashboardPriorityResponse> priorities,
        List<DashboardActivityResponse> activities,
        String aiSummary) {

    /**
     * A group in the teacher's dashboard.
     *
     * @param id group ID
     * @param name group name
     * @param childCount active children in it
     */
    public record Group(Long id, String name, int childCount) {
    }
}
