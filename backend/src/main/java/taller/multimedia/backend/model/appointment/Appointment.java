package taller.multimedia.backend.model.appointment;

import java.time.LocalDateTime;
import java.util.UUID;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {
    @Id  
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "parent_identification", nullable = false)
    private String parentIdentification;

    @Column(name = "parent_name", nullable = false)
    private String parentName;

    @Column(name = "parent_email", nullable = false)
    private String parentEmail;

    @Column(name = "parent_phone", nullable = false)
    private String parentPhone;

    @Column(name = "parent_occupation", nullable = false)
    private String parentOccupation;

    @Column(name = "child_name", nullable = false)
    private String childName;

    @Column(name = "appointment_date", nullable = false)
    private LocalDateTime appointmentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Column(name = "parent_notes", nullable = false, length = 4000)
    private String parentNotes;

    @Column(name = "teacher_conclusion", length = 4000)
    private String teacherConclusion;

    @Column(name = "google_event_id")
    private String googleEventId;

    @Column(name = "language")
    private String language;

    @Column(name = "reminder_sent", nullable = false)
    private boolean reminderSent = false;

    public boolean isReminderSent() { return reminderSent; }
    
    public void setReminderSent(boolean reminderSent) { this.reminderSent = reminderSent; }

    public String getGoogleEventId() { return googleEventId; }
    
    public void setGoogleEventId(String googleEventId) { this.googleEventId = googleEventId; }
}
