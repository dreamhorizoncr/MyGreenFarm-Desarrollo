package taller.multimedia.backend.dto.dashboard;

import java.time.LocalDateTime;

public record DashboardActivityResponse(
        String id,
        String type,
        String title,
        LocalDateTime createdAt,
        String href) {
}
