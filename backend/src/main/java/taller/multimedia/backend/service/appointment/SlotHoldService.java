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

/**
 * Temporarily holds an appointment time slot while a family fills in the booking form, so two
 * people cannot book the same slot.
 *
 * <p>Holds live in memory for {@link #HOLD_DURATION} and are not shared between server instances.
 * Each change is pushed to the open booking pages through {@link SlotEventService}.
 */
@Service
public class SlotHoldService {

    /**
     * How long a slot stays held without activity.
     */
    public static final Duration HOLD_DURATION = Duration.ofMinutes(10);
    /**
     * Maximum slots one client (IP address) may hold at the same time, to prevent blocking the
     * whole schedule.
     */
    static final int MAX_HOLDS_PER_CLIENT = 3;

    static final String HELD_BY_OTHER_MESSAGE =
            "Someone else is booking this time slot right now. Choose another time slot.";
    private static final Pattern HOLDER_ID = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

    /**
     * A held slot.
     *
     * @param holderId random ID of the booking form that holds it
     * @param clientKey client that made the request, used to apply the per-client limit
     * @param expiresAt when the hold expires
     */
    record Hold(String holderId, String clientKey, Instant expiresAt) {
    }

    /**
     * Result of holding a slot.
     *
     * @param slot held slot, truncated to the minute
     * @param expiresAt when the hold expires unless it is renewed
     */
    public record HoldResult(LocalDateTime slot, Instant expiresAt) {
    }

    private final Map<LocalDateTime, Hold> holds = new HashMap<>();
    private final Map<LocalDateTime, ReentrantLock> slotLocks = new ConcurrentHashMap<>();
    private final SlotEventService slotEventService;
    private final ScheduleConfigService scheduleConfigService;
    private final Clock clock;

    /**
     * @param slotEventService publishes slot changes to the booking pages
     * @param scheduleConfigService tells which slots exist and are free
     */
    @Autowired
    public SlotHoldService(SlotEventService slotEventService, ScheduleConfigService scheduleConfigService) {
        this(slotEventService, scheduleConfigService, Clock.systemDefaultZone());
    }

    /**
     * Constructor for tests, with a controllable clock.
     *
     * @param slotEventService publishes slot changes
     * @param scheduleConfigService tells which slots exist and are free
     * @param clock clock used to expire holds
     */
    SlotHoldService(SlotEventService slotEventService, ScheduleConfigService scheduleConfigService, Clock clock) {
        this.slotEventService = slotEventService;
        this.scheduleConfigService = scheduleConfigService;
        this.clock = clock;
    }

    /**
     * @param slot requested slot
     * @return the slot without seconds, so the same slot always has the same key
     */
    public static LocalDateTime normalize(LocalDateTime slot) {
        return slot.truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * Holds a slot for a booking form, or renews the hold if the same form already holds it. Any
     * other slot held by the same form is released.
     *
     * @param requestedSlot slot to hold
     * @param holderId random ID of the booking form (8 to 64 letters, digits or hyphens)
     * @param clientKey client that makes the request
     * @return the held slot and when the hold expires
     * @throws InvalidFieldException if the holder ID is not valid
     * @throws SlotUnavailableException if the slot is not free, another form holds it, or the
     *     client already holds too many slots
     */
    public HoldResult hold(LocalDateTime requestedSlot, String holderId, String clientKey) {
        validateHolderId(holderId);
        LocalDateTime slot = normalize(requestedSlot);

        if (!scheduleConfigService.getAvailableSlotsForDate(slot.toLocalDate()).contains(slot.toLocalTime())) {
            throw new SlotUnavailableException("That time slot is no longer available. Choose another time slot.");
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

            long clientHolds = holds.values().stream().filter(hold -> hold.clientKey().equals(clientKey)).count();
            if (current == null && clientHolds >= MAX_HOLDS_PER_CLIENT) {
                throw new SlotUnavailableException(
                        "You are holding too many time slots at once. Finish or cancel a reservation.");
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

    /**
     * Releases every slot held by a booking form. Does nothing for a blank ID.
     *
     * @param holderId booking form ID
     */
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

    /**
     * Runs the booking of a slot while no other booking of the same slot can run, and frees its
     * hold afterwards.
     *
     * @param requestedSlot slot being booked
     * @param holderId booking form ID; a valid hold by another form blocks the booking
     * @param booking code that saves the appointment
     * @param <T> result type of the booking
     * @return the result of {@code booking}
     * @throws SlotUnavailableException if another form holds the slot
     */
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

    /**
     * @return the slots held right now, after dropping the expired holds
     */
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

    /**
     * Releases expired holds every 15 seconds and drops the locks of past slots.
     */
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

    /**
     * Removes expired holds. Must be called while holding the {@code holds} lock.
     *
     * @param released list that receives the released slots, to publish them after the lock is
     *     released
     */
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
            throw new InvalidFieldException("holderId", "The reservation ID is not valid.");
        }
    }
}
