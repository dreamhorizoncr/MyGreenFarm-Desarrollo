package taller.multimedia.backend.model.appointment;

import jakarta.persistence.*;
import lombok.Data;
import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "weekly_schedules")
@Data
public class WeeklySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private DayOfWeek dayOfWeek; 

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean active = true;
}