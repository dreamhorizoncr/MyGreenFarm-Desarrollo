package taller.multimedia.backend.service.appointment;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.exception.SlotUnavailableException;
import taller.multimedia.backend.service.appointment.SlotEventService.SlotStatus;

@Service
public class SlotHoldService {

    public static final Duration HOLD_DURATION = Duration.ofMinutes(10);
    static final int MAX_HOLDS_PER_CLIENT = 3;

    static final String HELD_BY_OTHER_MESSAGE =
            "Otra persona está reservando este horario en este momento. Elige otro horario.";
    private static final Pattern HOLDER_ID = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

    record Hold(String holderId, String clientKey, Instant expiresAt) {
    }

    public record HoldResult(LocalDateTime slot, Instant expiresAt) {
    }

    private final Map<LocalDateTime, Hold> holds = new HashMap<>();
    private final Map<LocalDateTime, ReentrantLock> slotLocks = new ConcurrentHashMap<>();
    private final SlotEventService slotEventService;
    private final ScheduleConfigService scheduleConfigService;
    private final Clock clock;

    @Autowired
    public SlotHoldService(SlotEventService slotEventService, ScheduleConfigService scheduleConfigService) {
        this(slotEventService, scheduleConfigService, Clock.systemDefaultZone());
    }

    SlotHoldService(SlotEventService slotEventService, ScheduleConfigService scheduleConfigService, Clock clock) {
        this.slotEventService = slotEventService;
        this.scheduleConfigService = scheduleConfigService;
        this.clock = clock;
    }

    public static LocalDateTime normalize(LocalDateTime slot) {
        return slot.truncatedTo(ChronoUnit.MINUTES);
    }

    public HoldResult hold(LocalDateTime requestedSlot, String holderId, String clientKey) {
        validateHolderId(holderId);
        LocalDateTime slot = normalize(requestedSlot);

        if (!scheduleConfigService.getAvailableSlotsForDate(slot.toLocalDate()).contains(slot.toLocalTime())) {
            throw new SlotUnavailableException("Ese horario ya no está disponible. Elige otro horario.");
        }

        List<LocalDateTime> released = new ArrayList<>();
        HoldResult result;
        boolean isNewHold;
        synchronized (holds) {
            purgeExpiredLocked(released);
            Hold current = holds.get(slot);
            if (current != null && !current.holderId().equals(holderId)) {
                throw new SlotUnavailableException(HELD_BY_OTHER_MESSAGE);
            }

            holds.entrySet().removeIf(entry -> {
                boolean previousOfHolder = entry.getValue().holderId().equals(holderId) && !entry.getKey().equals(slot);
                if (previousOfHolder) released.add(entry.getKey());
                return previousOfHolder;
            });

            long clientHolds = holds.values().stream().filter(h -> h.clientKey().equals(clientKey)).count();
            if (current == null && clientHolds >= MAX_HOLDS_PER_CLIENT) {
                throw new SlotUnavailableException(
                        "Tienes demasiados horarios apartados al mismo tiempo. Termina o cancela una reserva.");
            }

            Instant expiresAt = clock.instant().plus(HOLD_DURATION);
            holds.put(slot, new Hold(holderId, clientKey, expiresAt));
            isNewHold = current == null;
            result = new HoldResult(slot, expiresAt);
        }

        released.forEach(previous -> slotEventService.publish(previous, SlotStatus.RELEASED));
        if (isNewHold) slotEventService.publish(slot, SlotStatus.HELD);
        return result;
    }

    public void release(String holderId) {
        if (holderId == null || holderId.isBlank()) return;
        List<LocalDateTime> released = new ArrayList<>();
        synchronized (holds) {
            holds.entrySet().removeIf(entry -> {
                boolean mine = entry.getValue().holderId().equals(holderId);
                if (mine) released.add(entry.getKey());
                return mine;
            });
        }
        released.forEach(slot -> slotEventService.publish(slot, SlotStatus.RELEASED));
    }

    public <T> T bookExclusively(LocalDateTime requestedSlot, String holderId, Supplier<T> booking) {
        LocalDateTime slot = normalize(requestedSlot);
        ReentrantLock lock = slotLocks.computeIfAbsent(slot, key -> new ReentrantLock());
        lock.lock();
        try {
            ensureNotHeldByOther(slot, holderId);
            T result = booking.get();
            synchronized (holds) {
                holds.remove(slot);
            }
            slotEventService.publish(slot, SlotStatus.BOOKED);
            return result;
        } finally {
            lock.unlock();
        }
    }

    public List<LocalDateTime> heldSlots() {
        List<LocalDateTime> released = new ArrayList<>();
        List<LocalDateTime> result;
        synchronized (holds) {
            purgeExpiredLocked(released);
            result = List.copyOf(holds.keySet());
        }
        released.forEach(slot -> slotEventService.publish(slot, SlotStatus.RELEASED));
        return result;
    }

    @Scheduled(fixedRate = 15_000)
    public void purgeExpired() {
        List<LocalDateTime> released = new ArrayList<>();
        synchronized (holds) {
            purgeExpiredLocked(released);
        }
        released.forEach(slot -> slotEventService.publish(slot, SlotStatus.RELEASED));
        slotLocks.entrySet().removeIf(entry -> entry.getKey().isBefore(LocalDateTime.now(clock)) && !entry.getValue().isLocked());
    }

    private void ensureNotHeldByOther(LocalDateTime slot, String holderId) {
        synchronized (holds) {
            Hold current = holds.get(slot);
            boolean heldByOther = current != null
                    && current.expiresAt().isAfter(clock.instant())
                    && !current.holderId().equals(holderId);
            if (heldByOther) {
                throw new SlotUnavailableException(HELD_BY_OTHER_MESSAGE);
            }
        }
    }

    private void purgeExpiredLocked(List<LocalDateTime> released) {
        Instant now = clock.instant();
        holds.entrySet().removeIf(entry -> {
            boolean expired = !entry.getValue().expiresAt().isAfter(now);
            if (expired) released.add(entry.getKey());
            return expired;
        });
    }

    private void validateHolderId(String holderId) {
        if (holderId == null || !HOLDER_ID.matcher(holderId).matches()) {
            throw new InvalidFieldException("holderId", "El identificador de la reserva no es válido.");
        }
    }
}
