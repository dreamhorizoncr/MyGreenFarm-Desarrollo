package taller.multimedia.backend.repository.appointment;

import taller.multimedia.backend.model.appointment.ScheduleException;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * Storage of the special hours or closed days of the appointment schedule.
 */
public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, Long> {
    Optional<ScheduleException> findByExceptionDate(LocalDate exceptionDate);
}
