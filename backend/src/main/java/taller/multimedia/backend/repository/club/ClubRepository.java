package taller.multimedia.backend.repository.club;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.club.Club;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {

    @Query("SELECT DISTINCT c FROM Club c LEFT JOIN FETCH c.images WHERE c.id = :id")
    Optional<Club> findByIdWithImages(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM Club c LEFT JOIN FETCH c.images")
    List<Club> findAllWithImages();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
