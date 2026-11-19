package taller.multimedia.backend.repository.serviceplan;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import taller.multimedia.backend.model.serviceplan.ServicePlan;

/**
 * Storage of service plans.
 */
public interface ServicePlanRepository extends JpaRepository<ServicePlan, UUID> {
    List<ServicePlan> findByIsActiveTrue();
    Page<ServicePlan> findByIsActiveTrue(Pageable pageable);
}
