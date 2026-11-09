package taller.multimedia.backend.dto.parent;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ParentRequest {
    @NotBlank(message = "The ID number is required")
    private String identification;

    @NotBlank(message = "The email address is required")
    @Email(message = "The email address format is not valid")
    private String email;

    @NotBlank(message = "The phone number is required")
    private String phoneNumber;

    @NotBlank(message = "The address is required")
    private String address;

    @NotBlank(message = "The name is required")
    private String firstName;

    @NotBlank(message = "The last name is required")
    private String lastName;

    private Boolean isActive = true;

    private String language;

    public String getIdentification() {
        return identification;
    }

    public void setIdentification(String identification) {
        this.identification = identification;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
