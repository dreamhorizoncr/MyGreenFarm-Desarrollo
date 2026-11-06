package taller.multimedia.backend.dto.dashboard;

import java.time.LocalDateTime;

public record DashboardPriorityResponse(
        String id,
        String type,
        String title,
        LocalDateTime dueAt,
        String priority,
        String href) {
}
