package taller.multimedia.backend.dto.service_plan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data 
public class ServicePlanRequest {

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 500, message = "La descripción no puede superar los 500 caracteres")
    private String description;

    @NotNull(message = "El precio es obligatorio")
    @Positive(message = "El precio debe ser mayor a cero")
    private BigDecimal price;

    @NotBlank(message = "El tipo de plan es obligatorio")
    private String type;

    @NotBlank(message = "El horario es obligatorio")
    @Size(max = 200, message = "El horario debe tener como máximo 200 caracteres")
    private String schedule;

    @NotBlank(message = "Los beneficios que incluye son obligatorios")
    @Size(max = 800, message = "Los beneficios deben tener como máximo 800 caracteres")
    private String includes;

    @NotBlank(message = "La moneda es obligatoria")
    @Size(max = 6, message = "El máximo de caracteres es de 6")
    private String currency;

    @Size(max = 140, message = "El texto alternativo debe tener como máximo 140 caracteres")
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