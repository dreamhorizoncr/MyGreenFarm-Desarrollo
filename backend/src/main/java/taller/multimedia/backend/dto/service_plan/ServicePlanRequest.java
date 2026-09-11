package taller.multimedia.backend.dto.service_plan;

import jakarta.validation.constraints.NotBlank;


public class ServicePlanRequest {

    @NotBlank(message = "El horario es obligatorio")
    private String schedule;

    @NotBlank(message = "Los beneficios que incluye son obligatorios")
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