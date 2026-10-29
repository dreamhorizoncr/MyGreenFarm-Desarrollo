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

@Service
public class SlotEventService {

    private static final Logger log = LoggerFactory.getLogger(SlotEventService.class);
    private static final long EMITTER_TIMEOUT_MS = 30L * 60 * 1000;
    private static final String EVENT_NAME = "slot";

    public enum SlotStatus { HELD, RELEASED, BOOKED }

    public record SlotEvent(String slot, SlotStatus status) {
    }

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

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

    @Scheduled(fixedRate = 20_000)
    public void heartbeat() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException | IllegalStateException e) {
                emitters.remove(emitter);
            }
        }
        if (log.isDebugEnabled()) log.debug("Conexiones SSE de horarios abiertas: {}", emitters.size());
    }

    int connectionCount() {
        return emitters.size();
    }
}
