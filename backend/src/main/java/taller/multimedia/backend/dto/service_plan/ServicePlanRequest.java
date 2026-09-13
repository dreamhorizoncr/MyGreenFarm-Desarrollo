package taller.multimedia.backend.dto.service_plan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


public class ServicePlanRequest {

    @NotBlank(message = "El horario es obligatorio")
    @Size(max = 200, message = "El horario debe tener como máximo 200 caracteres") 
    private String schedule;

    @NotBlank(message = "Los beneficios que incluye son obligatorios")
    @Size(max = 800, message = "Los beneficios deben tener como máximo 800 caracteres") 
    private String includes;

    @NotBlank(message = "El ID del precio de Stripe es obligatorio")
    private String stripePriceId;

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

    public String getStripePriceId() {
        return stripePriceId;
    }

    public void setStripePriceId(String stripePriceId) {
        this.stripePriceId = stripePriceId;
    }

}