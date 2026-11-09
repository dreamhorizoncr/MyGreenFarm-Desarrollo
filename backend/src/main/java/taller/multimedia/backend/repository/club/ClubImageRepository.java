package taller.multimedia.backend.repository.club;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.club.ClubImage;

import java.util.List;
import java.util.Optional;

public interface ClubImageRepository extends JpaRepository<ClubImage, Long> {

    List<ClubImage> findByClubIdOrderBySortOrderAsc(Long clubId);

    void deleteByClubId(Long clubId);

    Optional<ClubImage> findByClubIdAndIsCoverTrue(Long clubId);
}