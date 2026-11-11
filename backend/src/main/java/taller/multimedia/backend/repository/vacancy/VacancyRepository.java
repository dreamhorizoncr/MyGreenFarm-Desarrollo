package taller.multimedia.backend.repository.vacancy;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.vacancy.Vacancy;

import java.util.UUID;

public interface VacancyRepository extends JpaRepository<Vacancy, UUID> {
}
