package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;
import java.util.UUID;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.appointment.ReferralSource;

public record AppointmentResponse(
        UUID id,
        String parentIdentification,
        String parentName,
        String parentEmail,
        String parentPhone,
        String parentOccupation,
        String childName,
        LocalDateTime appointmentDate,
        AppointmentStatus status,
        String parentNotes,
        ReferralSource referralSource,
        String referralOtherDetail,
        String teacherConclusion) {

    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getParentIdentification(),
                appointment.getParentName(),
                appointment.getParentEmail(),
                appointment.getParentPhone(),
                appointment.getParentOccupation(),
                appointment.getChildName(),
                appointment.getAppointmentDate(),
                appointment.getStatus(),
                appointment.getParentNotes(),
                appointment.getReferralSource(),
                appointment.getReferralOtherDetail(),
                appointment.getTeacherConclusion());
    }
}
