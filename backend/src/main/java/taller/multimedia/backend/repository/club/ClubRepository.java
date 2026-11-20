package taller.multimedia.backend.repository.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import taller.multimedia.backend.model.club.Club;

import java.util.List;
import java.util.Optional;

/**
 * Storage of clubs.
 */
public interface ClubRepository extends JpaRepository<Club, Long> {

    /**
     * @param id club ID
     * @return the club with its images loaded in the same query
     */
    @Query("SELECT DISTINCT c FROM Club c LEFT JOIN FETCH c.images WHERE c.id = :id")
    Optional<Club> findByIdWithImages(@Param("id") Long id);

    /**
     * @return the clubs shown to visitors
     */
    @Query("SELECT c FROM Club c WHERE c.isPublished = true")
    List<Club> findAllPublishedClubs();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
