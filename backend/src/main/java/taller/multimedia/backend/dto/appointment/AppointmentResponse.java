package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;
import java.util.UUID;

import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.model.appointment.ReferralSource;

/**
 * An appointment as shown in the admin panel.
 *
 * @param id appointment ID
 * @param parentIdentification parent's ID number
 * @param parentName parent's name
 * @param parentEmail parent's email
 * @param parentPhone parent's phone with country code
 * @param parentOccupation parent's occupation
 * @param childName child's name
 * @param appointmentDate start of the appointment
 * @param status pending, confirmed or cancelled
 * @param parentNotes notes written by the family
 * @param referralSource how the family heard about the center
 * @param referralOtherDetail detail when the source is {@code OTHER}
 * @param teacherConclusion notes written after the visit
 */
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

    /**
     * @param appointment stored appointment
     * @return its response
     */
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
