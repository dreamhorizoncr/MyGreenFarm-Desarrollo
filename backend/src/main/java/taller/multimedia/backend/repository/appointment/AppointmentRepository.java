package taller.multimedia.backend.repository.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID>, JpaSpecificationExecutor<Appointment> {
    List<Appointment> findByAppointmentDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Appointment> findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(
            LocalDateTime startDate, LocalDateTime endDate);

    List<Appointment> findByAppointmentDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, AppointmentStatus status);

    List<Appointment> findByAppointmentDateBeforeAndStatus(LocalDateTime dateTime, AppointmentStatus status);

    long countByStatus(AppointmentStatus status);

    List<Appointment> findByStatusAndAppointmentDateBefore(AppointmentStatus status, LocalDateTime dateTime);
}