package taller.multimedia.backend.repository.appointment;

import taller.multimedia.backend.model.appointment.WeeklySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.DayOfWeek;
import java.util.Optional;

public interface WeeklyScheduleRepository extends JpaRepository<WeeklySchedule, Long> {
    Optional<WeeklySchedule> findByDayOfWeek(DayOfWeek dayOfWeek);
}