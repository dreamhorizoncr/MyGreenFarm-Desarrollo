package taller.multimedia.backend.dto.appointment;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import taller.multimedia.backend.model.appointment.ReferralSource;

@Data
public class AppointmentRequest {

    @NotBlank(message = "The ID type is required")
    private String idType;

    @NotBlank(message = "The ID number is required")
    private String parentIdentification;

    @NotBlank(message = "The parent or guardian name is required")
    @Size(min = 2, max = 150)
    private String parentName;

    @NotBlank(message = "The email is required")
    @Email(message = "The email format is not valid")
    @Size(max = 255, message = "The name must be at most 150 characters")
    private String parentEmail;

    @NotBlank(message = "The phone number is required")
    @Size(min = 8, max = 35, message = "The phone number must be at most 35 characters")
    private String parentPhone;

    @NotBlank(message = "The occupation is required")
    @Size(max = 150, message = "The occupation must be at most 150 characters")
    private String parentOccupation;

    @NotBlank(message = "The child's name is required")
    @Size(max = 150, message = "The child's name must be at most 150 characters")
    private String childName;

    @NotNull(message = "The appointment date is required")
    @Future(message = "The appointment date must be in the future")
    private LocalDateTime appointmentDate;

    @Size(max = 2000, message = "The reason must be at most 2000 characters")
    @NotBlank(message = "The reason or additional details are required")
    private String parentNotes;

    @NotNull(message = "The referralSource field is required")
    private ReferralSource referralSource;

    @Size(max = 255, message = "The reason must be at most 255 characters")
    private String referralOtherDetail;
    
    private String language;

    @Size(max = 64)
    private String holdId;
}
