package taller.multimedia.backend.model.forum;

import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "forum_community_comments", indexes = @Index(name = "idx_community_comments_post", columnList = "community_post_id"))
@Data @NoArgsConstructor @AllArgsConstructor
public class ForumCommunityComment {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "community_post_id", nullable = false) private ForumCommunityPost communityPost;
    @Column(nullable = false, length = 40) private String alias;
    @Column(nullable = false, length = 4000) private String content;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
}
