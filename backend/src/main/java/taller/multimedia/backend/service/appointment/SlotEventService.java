package taller.multimedia.backend.service.appointment;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Pushes appointment time slot changes to the booking pages that are open, using Server-Sent
 * Events, so two families do not try to book the same slot at once.
 */
@Service
public class SlotEventService {

    private static final Logger log = LoggerFactory.getLogger(SlotEventService.class);
    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000;
    private static final String EVENT_NAME = "slot";

    /**
     * What happened to a time slot.
     */
    public enum SlotStatus { HELD, RELEASED, BOOKED }

    /**
     * Event sent to the browsers.
     *
     * @param slot start of the time slot, in ISO-8601 format
     * @param status what happened to the slot
     */
    public record SlotEvent(String slot, SlotStatus status) {
    }

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Opens an event stream for a booking page and immediately sends it the slots that are
     * currently held.
     *
     * @param heldSlots slots held by other visitors at this moment
     * @return the stream; it closes after 30 minutes or when the browser disconnects
     */
    public SseEmitter subscribe(Collection<LocalDateTime> heldSlots) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(error -> emitters.remove(emitter));
        emitters.add(emitter);

        try {
            for (LocalDateTime slot : heldSlots) {
                emitter.send(SseEmitter.event().name(EVENT_NAME).data(new SlotEvent(slot.toString(), SlotStatus.HELD)));
            }
        } catch (IOException e) {
            emitters.remove(emitter);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    /**
     * Sends a slot change to every open booking page. Streams that can no longer be written to are
     * dropped.
     *
     * @param slot start of the time slot
     * @param status what happened to it
     */
    public void publish(LocalDateTime slot, SlotStatus status) {
        SlotEvent event = new SlotEvent(slot.toString(), status);
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name(EVENT_NAME).data(event));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
    }

    /**
     * Sends a comment to every open stream every 20 seconds so proxies do not close idle
     * connections, and drops the ones that are already closed.
     */
    @Scheduled(fixedRate = 20_000)
    public void heartbeat() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
        if (log.isDebugEnabled()) log.debug("Open time slot SSE connections: {}", emitters.size());
    }

    /**
     * @return number of open streams; used by the tests
     */
    int connectionCount() {
        return emitters.size();
    }
}
