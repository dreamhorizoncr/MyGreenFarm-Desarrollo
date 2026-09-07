package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AppointmentRequest {
    private String idType;
    private String parentIdentification;
    private String parentName;
    private String parentEmail;
    private String parentPhone;
    private String parentOccupation;
    private String childName;
    private LocalDateTime appointmentDate;
    private String parentNotes;
    private String language;
}
