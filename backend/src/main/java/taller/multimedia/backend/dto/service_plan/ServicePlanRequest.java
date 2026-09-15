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

    @NotBlank(message = "El ID del precio de Onvo es obligatorio")
    private String gatewayPriceId;

    @NotBlank(message = "El horario es obligatorio")
    @Size(max = 200, message = "El horario debe tener como máximo 200 caracteres")
    private String schedule;

    @NotBlank(message = "Los beneficios que incluye son obligatorios")
    @Size(max = 800, message = "Los beneficios deben tener como máximo 800 caracteres")
    private String includes;

    @NotBlank(message = "El payment URL es obligatorio")
    @Size(max = 300, message = "El payment URL deben tener como máximo 300 caracteres")
    private String paymentUrl;

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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getGatewayPriceId() {
        return gatewayPriceId;
    }

    public void setGatewayPriceId(String gatewayPriceId) {
        this.gatewayPriceId = gatewayPriceId;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    public String getIncludes() {
        return includes;
    }

    public void setIncludes(String includes) {
        this.includes = includes;
    }
}