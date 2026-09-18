package taller.multimedia.backend.model.appointment;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "schedule_exceptions")
@Data
public class ScheduleException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate exceptionDate; 

    @Column(nullable = false)
    private boolean closed; 

    private LocalTime startTime; 
    private LocalTime endTime;   

    @Column(length = 1000)
    private String reason; 
}
