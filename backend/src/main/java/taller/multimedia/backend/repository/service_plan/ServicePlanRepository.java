package taller.multimedia.backend.repository.service_plan;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.service_plans.ServicePlan;

public interface ServicePlanRepository extends JpaRepository<ServicePlan, UUID> {
    List<ServicePlan> findByIsActiveTrue();
}
