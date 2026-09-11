package taller.multimedia.backend.repository.service_plan;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import taller.multimedia.backend.model.service_plans.ServicePlan;

@Repository 
public interface ServicePlanRepository extends JpaRepository<ServicePlan, UUID> {
    List<ServicePlan> findByIsActiveTrue();

    boolean existsByStripePriceId(String stripePriceId);

    Optional<ServicePlan> findByStripePriceId(String stripePriceId);
}
