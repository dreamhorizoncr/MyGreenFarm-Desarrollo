package taller.multimedia.backend.service.dashboard;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import taller.multimedia.backend.dto.dashboard.DashboardAppointmentResponse;
import taller.multimedia.backend.dto.dashboard.DashboardSummaryResponse;
import taller.multimedia.backend.model.appointment.AppointmentStatus;
import taller.multimedia.backend.repository.appointment.AppointmentRepository;
import taller.multimedia.backend.repository.child.ChildRepository;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AppointmentRepository appointmentRepository;
    private final ChildRepository childRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(LocalDate date) {
        List<DashboardAppointmentResponse> appointments = appointmentRepository
                .findByAppointmentDateGreaterThanEqualAndAppointmentDateLessThanOrderByAppointmentDateAsc(
                        date.atStartOfDay(), date.plusDays(1).atStartOfDay())
                .stream()
                .map(DashboardAppointmentResponse::from)
                .toList();

        return new DashboardSummaryResponse(
                appointments,
                appointmentRepository.countByStatus(AppointmentStatus.PENDING),
                childRepository.countByIsActiveTrue());
    }
}
