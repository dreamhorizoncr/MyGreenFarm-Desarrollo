package taller.multimedia.backend.dto.dashboard;

import java.time.LocalDateTime;

/**
 * A pending task in the dashboard.
 *
 * @param id task ID
 * @param type kind of task, for example {@code appointment} or {@code evaluation}
 * @param title text shown
 * @param dueAt when it is due, or {@code null}
 * @param priority {@code high} or {@code medium}
 * @param href admin panel page to handle it
 */
public record DashboardPriorityResponse(
        String id,
        String type,
        String title,
        LocalDateTime dueAt,
        String priority,
        String href) {
}
