package taller.multimedia.backend.service.appointment;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

import taller.multimedia.backend.model.appointment.Appointment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GoogleCalendarService {

    @Value("${google.calendar.id}")
    private String calendarId;

    @Value("${google.calendar.credentials.path:#{null}}")
    private Resource credentialsResource;

    private Calendar getCalendarService() throws IOException, GeneralSecurityException {
        InputStream credentialsStream;
    
        // 1. Verificar si existe la variable de entorno en Render
        String credentialsJson = System.getenv("GOOGLE_CREDENTIALS_JSON");
        
        if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
            // Carga desde la variable de entorno (para producción en Render)
            credentialsStream = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
        } else if (credentialsResource != null && credentialsResource.exists()) {
            // Carga desde el archivo local (para desarrollo)
            credentialsStream = credentialsResource.getInputStream();
        } else {
            throw new FileNotFoundException("No se encontraron credenciales de Google Calendar ni en variable de entorno ni en archivo local.");
        }
        
        // Carga las credenciales desde el archivo JSON de la cuenta de servicio
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(credentialsStream)
                .createScoped(List.of("https://www.googleapis.com/auth/calendar"));

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("My Green Farm")
                .setRootUrl("https://www.googleapis.com/")
                .setServicePath("calendar/v3/")
                .build();
    }

    public List<String> getAvailableSlots(LocalDate date) throws Exception {
        Calendar service = getCalendarService();

        // Definir el rango del día a consultar
        String timeMin = date.atTime(7, 0).atZone(java.time.ZoneId.systemDefault()).toInstant().toString();
        String timeMax = date.atTime(17, 0).atZone(java.time.ZoneId.systemDefault()).toInstant().toString();

        FreeBusyRequest requestBody = new FreeBusyRequest();
        requestBody.setTimeMin(new com.google.api.client.util.DateTime(timeMin));
        requestBody.setTimeMax(new com.google.api.client.util.DateTime(timeMax));

        FreeBusyRequestItem item = new FreeBusyRequestItem();
        item.setId(calendarId);
        requestBody.setItems(List.of(item));

        FreeBusyResponse response = service.freebusy().query(requestBody).execute();

        if (response.getCalendars() == null || response.getCalendars().get(calendarId) == null) {
            throw new RuntimeException("No se pudo acceder al calendario con ID: " + calendarId);
        }

        List<TimePeriod> busyPeriods = response.getCalendars().get(calendarId).getBusy();

        // Lógica para calcular los espacios libres de 1 hora entre las 7:00 y las 17:00
        return calculateFreeSlots(date, busyPeriods);
    }

    private List<String> calculateFreeSlots(LocalDate date, List<TimePeriod> busyPeriods) {
        List<String> freeSlots = new ArrayList<>();
        LocalTime dayStart = LocalTime.of(7, 0);
        LocalTime dayEnd = LocalTime.of(17, 0);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
        java.time.ZoneId zoneId = java.time.ZoneId.systemDefault();

        LocalTime currentSlotStart = dayStart;

        while (currentSlotStart.plusHours(1).compareTo(dayEnd) <= 0) {
            LocalTime currentSlotEnd = currentSlotStart.plusHours(1);
            boolean isBusy = false;

            if (busyPeriods != null) {
                java.time.ZonedDateTime slotStartZdt = date.atTime(currentSlotStart).atZone(zoneId);
                java.time.ZonedDateTime slotEndZdt = date.atTime(currentSlotEnd).atZone(zoneId);

                Instant slotStartInstant = slotStartZdt.toInstant();
                Instant slotEndInstant = slotEndZdt.toInstant();

                for (TimePeriod period : busyPeriods) {
                    Instant busyStartInstant = Instant.parse(period.getStart().toString());
                    Instant busyEndInstant = Instant.parse(period.getEnd().toString());

                    // Verificar si hay solapamiento exacto entre el slot y el evento ocupado
                    if (slotStartInstant.isBefore(busyEndInstant) && slotEndInstant.isAfter(busyStartInstant)) {
                        isBusy = true;
                        break;
                    }
                }
            }

            if (!isBusy) {
                freeSlots.add(currentSlotStart.format(formatter) + " - " + currentSlotEnd.format(formatter));
            }
            currentSlotStart = currentSlotStart.plusHours(1);
        }

        return freeSlots;
    }

    public Map<String, List<String>> getAvailableSlotsForWeek(LocalDate referenceDate) throws Exception {
        Calendar service = getCalendarService();

        // Encontrar el Lunes de esa semana y el Viernes
        LocalDate monday = referenceDate
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        LocalDate friday = referenceDate
                .with(java.time.temporal.TemporalAdjusters.nextOrSame(java.time.DayOfWeek.FRIDAY));

        // Rango de toda la semana laboral (Lunes 07:00 a Viernes 17:00)
        String timeMin = monday.atTime(7, 0).atZone(java.time.ZoneId.systemDefault()).toInstant().toString();
        String timeMax = friday.atTime(17, 0).atZone(java.time.ZoneId.systemDefault()).toInstant().toString();

        FreeBusyRequest requestBody = new FreeBusyRequest();
        requestBody.setTimeMin(new com.google.api.client.util.DateTime(timeMin));
        requestBody.setTimeMax(new com.google.api.client.util.DateTime(timeMax));

        FreeBusyRequestItem item = new FreeBusyRequestItem();
        item.setId(calendarId);
        requestBody.setItems(List.of(item));

        FreeBusyResponse response = service.freebusy().query(requestBody).execute();

        if (response.getCalendars() == null || response.getCalendars().get(calendarId) == null) {
            throw new RuntimeException("No se pudo acceder al calendario con ID: " + calendarId);
        }

        List<TimePeriod> busyPeriods = response.getCalendars().get(calendarId).getBusy();

        // Construir el mapa de respuesta por día (Lunes a Viernes)
        Map<String, List<String>> weeklySlots = new java.util.LinkedHashMap<>();
        LocalDate current = monday;

        while (!current.isAfter(friday)) {
            List<String> dailySlots = calculateFreeSlots(current, busyPeriods);
            weeklySlots.put(current.toString(), dailySlots);
            current = current.plusDays(1);
        }

        return weeklySlots;
    }

    public void addAppointmentToCalendar(Appointment appointment) {
        try {
            Calendar service = getCalendarService();

            Event event = new Event()
                    .setSummary("Cita: " + appointment.getChildName())
                    .setDescription("Padre/Madre: " + appointment.getParentName() +
                            "\nTel: " + appointment.getParentPhone() +
                            "\nEmail: " + appointment.getParentEmail() +
                            "\nNotas: " + appointment.getParentNotes());

            LocalDateTime startDateTime = appointment.getAppointmentDate();
            LocalDateTime endDateTime = startDateTime.plusMinutes(30);

            String startIso = startDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();
            String endIso = endDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();

            event.setStart(new EventDateTime().setDateTime(new DateTime(startIso)));
            event.setEnd(new EventDateTime().setDateTime(new DateTime(endIso)));

            // Ejecutamos la inserción y guardamos el evento devuelto por Google
            Event createdEvent = service.events().insert(calendarId, event).execute();

            // Guardamos el ID único de Google en la cita 
            appointment.setGoogleEventId(createdEvent.getId());

        } catch (Exception e) {
            throw new RuntimeException("Error al sincronizar la cita con Google Calendar", e);
        }
    }

    public void removeAppointmentFromCalendar(Appointment appointment) {
        try {
            // Si por alguna razón la cita no tiene ID de Google asociado, no intentamos
            // borrar nada
            if (appointment.getGoogleEventId() == null || appointment.getGoogleEventId().isEmpty()) {
                return;
            }

            Calendar service = getCalendarService();

            // Borramos el evento usando el calendario y el ID del evento
            service.events().delete(calendarId, appointment.getGoogleEventId()).execute();

        } catch (Exception e) {
            // Maneja el error según prefieras (puedes lanzar excepción o solo loguearlo)
            throw new RuntimeException("Error al eliminar la cita de Google Calendar", e);
        }
    }

    public void updateAppointmentInCalendar(Appointment appointment, String newPrefix) {
        try {
            if (appointment.getGoogleEventId() == null || appointment.getGoogleEventId().isEmpty()) {
                return;
            }

            Calendar service = getCalendarService();

            // Buscamos el evento existente en Google
            Event event = service.events().get(calendarId, appointment.getGoogleEventId()).execute();

            // Actualizamos el resumen/título
            event.setSummary(newPrefix + appointment.getChildName());

            // Guardamos los cambios en Google
            service.events().update(calendarId, appointment.getGoogleEventId(), event).execute();

        } catch (Exception e) {
            throw new RuntimeException("Error al actualizar la cita en Google Calendar", e);
        }
    }

    public void rescheduleAppointmentInCalendar(Appointment appointment, LocalDateTime newStartDateTime) {
        try {
            // 1. Verificar si la cita tiene un ID de Google válido
            if (appointment.getGoogleEventId() == null || appointment.getGoogleEventId().trim().isEmpty()) {
                System.out.println("Advertencia: La cita ID " + appointment.getId() + " no tiene un googleEventId asociado. Se intentará crear como nuevo evento.");
                addAppointmentToCalendar(appointment);
                return;
            }

            Calendar service = getCalendarService();
            
            // 2. Intentar obtener el evento existente
            Event event;
            try {
                event = service.events().get(calendarId, appointment.getGoogleEventId()).execute();
            } catch (Exception e) {
                System.out.println("El evento con ID de Google '" + appointment.getGoogleEventId() + "' no fue encontrado. Se creará uno nuevo.");
                addAppointmentToCalendar(appointment);
                return;
            }
            
            // 3. Calcular fechas en formato ISO con la zona horaria correcta
            LocalDateTime newEndDateTime = newStartDateTime.plusMinutes(30);
            String startIso = newStartDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();
            String endIso = newEndDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();

            event.setStart(new EventDateTime().setDateTime(new DateTime(startIso)));
            event.setEnd(new EventDateTime().setDateTime(new DateTime(endIso)));
            
            // 4. Actualizar descripción
            event.setDescription("Cita Reprogramada\nPadre/Madre: " + appointment.getParentName() + 
                                    "\nTel: " + appointment.getParentPhone() + 
                                    "\nEmail: " + appointment.getParentEmail());

            // 5. Ejecutar la actualización en Google Calendar
            service.events().update(calendarId, appointment.getGoogleEventId(), event).execute();
            System.out.println("Evento de Google Calendar actualizado exitosamente para la cita ID: " + appointment.getId());
            
        } catch (Exception e) {
            System.err.println("Error crítico al sincronizar la reprogramación en Google Calendar: " + e.getMessage());
            throw new RuntimeException("Error al actualizar la cita en Google Calendar", e);
        }
    }
}