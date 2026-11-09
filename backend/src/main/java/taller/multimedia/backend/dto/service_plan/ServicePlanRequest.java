package taller.multimedia.backend.dto.service_plan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data 
public class ServicePlanRequest {

    @NotBlank(message = "The name is required")
    private String name;

    @NotBlank(message = "The description is required")
    @Size(max = 500, message = "The description cannot exceed 500 characters")
    private String description;

    @NotNull(message = "The price is required")
    @Positive(message = "The price must be greater than zero")
    private BigDecimal price;

    @NotBlank(message = "The plan type is required")
    private String type;

    @NotBlank(message = "The schedule is required")
    @Size(max = 200, message = "The schedule must be at most 200 characters")
    private String schedule;

    @NotBlank(message = "The included benefits are required")
    @Size(max = 800, message = "The benefits must be at most 800 characters")
    private String includes;

    @NotBlank(message = "The currency is required")
    @Size(max = 6, message = "The maximum length is 6 characters")
    private String currency;

    @Size(max = 140, message = "The alt text must be at most 140 characters")
    private String imageAlt;

    public String getImageAlt() {
        return imageAlt;
    }

    public void setImageAlt(String imageAlt) {
        this.imageAlt = imageAlt;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

}