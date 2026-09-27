package taller.multimedia.backend.repository.parent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import taller.multimedia.backend.model.parent.Parent;
import taller.multimedia.backend.repository.newsletter_subscriber.SubscriberEmailProjection;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParentRepository extends JpaRepository<Parent, Integer> {

    Optional<Parent> findByEmail(String email);

    @Query("SELECT p.email as email, p.language as language FROM Parent p")
    List<SubscriberEmailProjection> findAllParentsInfo();
}
