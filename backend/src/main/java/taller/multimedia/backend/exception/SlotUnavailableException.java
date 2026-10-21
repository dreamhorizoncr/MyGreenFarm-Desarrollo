package taller.multimedia.backend.exception;

// El horario elegido ya está reservado o en proceso de reserva por otra persona (HTTP 409)
public class SlotUnavailableException extends RuntimeException {

    public SlotUnavailableException(String message) {
        super(message);
    }
}
