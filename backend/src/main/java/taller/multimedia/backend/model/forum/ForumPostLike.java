package taller.multimedia.backend.model.forum;

import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity 
@Table (name = "forum_community_post_likes", uniqueConstraints = @UniqueConstraint (columnNames = {
        "community_post_id", "anon_id"
}))
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class ForumPostLike {

    @Id 
    @GeneratedValue 
    @UuidGenerator 
    private UUID id;

    @ManyToOne (fetch = FetchType.LAZY, optional = false)
    @JoinColumn (name = "community_post_id", nullable = false)
    private ForumCommunityPost communityPost;

    @Column (name = "anon_id", nullable = false, length = 36)
    private String anonId;
}
