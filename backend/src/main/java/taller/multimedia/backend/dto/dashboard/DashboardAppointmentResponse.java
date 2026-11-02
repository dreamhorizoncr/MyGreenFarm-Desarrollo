package taller.multimedia.backend.dto.dashboard;

import java.time.LocalDateTime;
import java.util.UUID;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;

public record DashboardAppointmentResponse(
        UUID id,
        LocalDateTime appointmentDate,
        String parentName,
        String childName,
        AppointmentStatus status) {

    public static DashboardAppointmentResponse from(Appointment appointment) {
        return new DashboardAppointmentResponse(
                appointment.getId(),
                appointment.getAppointmentDate(),
                appointment.getParentName(),
                appointment.getChildName(),
                appointment.getStatus());
    }
}
