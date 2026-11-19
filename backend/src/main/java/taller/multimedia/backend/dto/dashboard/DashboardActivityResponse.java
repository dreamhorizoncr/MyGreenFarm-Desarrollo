package taller.multimedia.backend.dto.dashboard;

import java.time.LocalDateTime;

/**
 * Recent content shown in the dashboard's activity list.
 *
 * @param id content ID
 * @param type {@code announcement}, {@code gallery} or {@code forum}
 * @param title content title
 * @param createdAt when it was created
 * @param href admin panel page to open it
 */
public record DashboardActivityResponse(
        String id,
        String type,
        String title,
        LocalDateTime createdAt,
        String href) {
}
