package taller.multimedia.backend.service.appointment;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import taller.multimedia.backend.exception.SlotUnavailableException;
import taller.multimedia.backend.service.appointment.SlotEventService.SlotStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SlotHoldServiceTest {

    private static final LocalDate DAY = LocalDate.of(2030, 3, 4);
    private static final LocalDateTime SLOT = DAY.atTime(9, 0);
    private static final LocalDateTime OTHER_SLOT = DAY.atTime(10, 0);
    private static final String ANA = "holder-ana-1234";
    private static final String LUIS = "holder-luis-5678";

    @Mock
    private SlotEventService slotEventService;

    @Mock
    private ScheduleConfigService scheduleConfigService;

    private MutableClock clock;
    private SlotHoldService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2030-03-01T12:00:00Z"));
        service = new SlotHoldService(slotEventService, scheduleConfigService, clock);
        lenient().when(scheduleConfigService.getAvailableSlotsForDate(any()))
                .thenReturn(List.of(LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(11, 0), LocalTime.of(12, 0)));
    }

    @Test
    void hold_blocksTheSlotForAnotherPerson() {
        service.hold(SLOT, ANA, "ip-1");

        assertThrows(SlotUnavailableException.class, () -> service.hold(SLOT, LUIS, "ip-2"));
        verify(slotEventService).publish(SLOT, SlotStatus.HELD);
    }

    @Test
    void hold_byTheSamePersonRenewsInsteadOfFailing() {
        service.hold(SLOT, ANA, "ip-1");
        clock.advance(Duration.ofMinutes(8));

        SlotHoldService.HoldResult renewed = service.hold(SLOT, ANA, "ip-1");

        assertThat(renewed.expiresAt()).isEqualTo(clock.instant().plus(SlotHoldService.HOLD_DURATION));
    }

    @Test
    void hold_releasesThePreviousSlotOfThatPerson() {
        service.hold(SLOT, ANA, "ip-1");
        service.hold(OTHER_SLOT, ANA, "ip-1");

        verify(slotEventService).publish(SLOT, SlotStatus.RELEASED);
        service.hold(SLOT, LUIS, "ip-2");
    }

    @Test
    void hold_expiresAfterTheHoldDuration() {
        service.hold(SLOT, ANA, "ip-1");
        clock.advance(SlotHoldService.HOLD_DURATION.plusSeconds(1));

        service.hold(SLOT, LUIS, "ip-2");

        verify(slotEventService).publish(SLOT, SlotStatus.RELEASED);
    }

    @Test
    void hold_rejectsASlotThatIsNoLongerAvailable() {
        lenient().when(scheduleConfigService.getAvailableSlotsForDate(any())).thenReturn(List.of(LocalTime.of(10, 0)));

        assertThrows(SlotUnavailableException.class, () -> service.hold(SLOT, ANA, "ip-1"));
    }

    @Test
    void hold_limitsHowManySlotsOneClientCanBlock() {
        for (int i = 0; i < SlotHoldService.MAX_HOLDS_PER_CLIENT; i++) {
            service.hold(DAY.atTime(9 + i, 0), "holder-bot-000" + i, "ip-bot");
        }

        assertThrows(SlotUnavailableException.class, () -> service.hold(DAY.atTime(12, 0), "holder-bot-9999", "ip-bot"));
    }

    @Test
    void bookExclusively_rejectsWhenAnotherPersonHoldsTheSlot() {
        service.hold(SLOT, ANA, "ip-1");

        assertThrows(SlotUnavailableException.class, () -> service.bookExclusively(SLOT, LUIS, () -> "cita"));
    }

    @Test
    void bookExclusively_letsTheHolderBookAndAnnouncesIt() {
        service.hold(SLOT, ANA, "ip-1");

        String result = service.bookExclusively(SLOT, ANA, () -> "cita");

        assertThat(result).isEqualTo("cita");
        verify(slotEventService).publish(SLOT, SlotStatus.BOOKED);
        assertThat(service.heldSlots()).doesNotContain(SLOT);
    }

    @Test
    void bookExclusively_onlyOneOfTwoSimultaneousBookingsSucceeds() throws Exception {
        List<String> saved = new CopyOnWriteArrayList<>();
        AtomicInteger rejected = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);

        Runnable attempt = () -> {
            try {
                start.await();
                service.bookExclusively(SLOT, null, () -> {
                    if (!saved.isEmpty()) throw new SlotUnavailableException("ocupado");
                    sleep(100);
                    saved.add("cita");
                    return "cita";
                });
            } catch (SlotUnavailableException e) {
                rejected.incrementAndGet();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        };

        Future<?> first = pool.submit(attempt);
        Future<?> second = pool.submit(attempt);
        start.countDown();
        first.get(5, TimeUnit.SECONDS);
        second.get(5, TimeUnit.SECONDS);
        pool.shutdown();

        assertThat(saved).hasSize(1);
        assertThat(rejected.get()).isEqualTo(1);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneId.of("America/Costa_Rica");
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
