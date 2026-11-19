package taller.multimedia.backend.service.appointment;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.*;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

import lombok.extern.slf4j.Slf4j;
import taller.multimedia.backend.model.appointment.Appointment;
import taller.multimedia.backend.model.user.User;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Writes appointments and teachers' birthdays to the center's Google Calendar ({@code
 * google.calendar.id}) using a service account.
 *
 * <p>Credentials are read from the {@code GOOGLE_CREDENTIALS_JSON} environment variable or, if it
 * is not set, from the file in {@code google.calendar.credentials.path}. Appointment events last 59
 * minutes so consecutive appointments do not overlap.
 */
@Slf4j
@Service
public class GoogleCalendarService {
    private static final ZoneId CALENDAR_ZONE = ZoneId.of("America/Costa_Rica");

    @Value("${google.calendar.id}")
    private String calendarId;

    @Value("${google.calendar.credentials.path:#{null}}")
    private Resource credentialsResource;

    /**
     * @return a Google Calendar client with a 5-second connect timeout and 15-second read and write
     *     timeouts
     * @throws FileNotFoundException if no credentials are configured
     * @throws IOException if the credentials cannot be read
     * @throws GeneralSecurityException if the HTTPS transport cannot be created
     */
    private Calendar getCalendarService() throws IOException, GeneralSecurityException {
        InputStream credentialsStream;

        String credentialsJson = System.getenv("GOOGLE_CREDENTIALS_JSON");

        if (credentialsJson != null && !credentialsJson.trim().isEmpty()) {
            credentialsStream = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
        } else if (credentialsResource != null && credentialsResource.exists()) {
            long start = System.currentTimeMillis();
            credentialsStream = credentialsResource.getInputStream();
            log.info("Loading the calendar took {} ms", System.currentTimeMillis() - start);
        } else {
            throw new FileNotFoundException(
                    "No Google Calendar credentials were found in the environment variable or in a local file.");
        }

        GoogleCredentials credentials = GoogleCredentials
                .fromStream(credentialsStream)
                .createScoped(List.of("https://www.googleapis.com/auth/calendar"));

        HttpRequestInitializer requestInitializer = request -> {
            new HttpCredentialsAdapter(credentials).initialize(request);
            request.setConnectTimeout(5_000);
            request.setReadTimeout(15_000);
            request.setWriteTimeout(15_000);
        };

        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer)
                .setApplicationName("My Green Farm")
                .setRootUrl("https://www.googleapis.com/")
                .setServicePath("calendar/v3/")
                .build();
    }

    /**
     * Creates the event of an appointment, with the parent's contact details in the description,
     * and stores the Google event ID in the appointment (the caller saves it).
     *
     * @param appointment new appointment
     * @throws RuntimeException if Google Calendar fails
     */
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
            LocalDateTime endDateTime = startDateTime.plusMinutes(59);

            String startIso = startDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();
            String endIso = endDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();

            event.setStart(new EventDateTime().setDateTime(new DateTime(startIso)));
            event.setEnd(new EventDateTime().setDateTime(new DateTime(endIso)));

            Event createdEvent = service.events().insert(calendarId, event).execute();

            appointment.setGoogleEventId(createdEvent.getId());

        } catch (Exception e) {
            throw new RuntimeException("Error syncing the appointment with Google Calendar", e);
        }
    }

    /**
     * Deletes the event of an appointment. Does nothing if the appointment has no event.
     *
     * @param appointment cancelled appointment
     * @throws RuntimeException if Google Calendar fails
     */
    public void removeAppointmentFromCalendar(Appointment appointment) {
        try {
            if (appointment.getGoogleEventId() == null || appointment.getGoogleEventId().isEmpty()) {
                return;
            }

            Calendar service = getCalendarService();

            service.events().delete(calendarId, appointment.getGoogleEventId()).execute();

        } catch (Exception e) {
            throw new RuntimeException("Error deleting the appointment from Google Calendar", e);
        }
    }

    /**
     * Changes the title of an appointment's event, for example to mark it as confirmed. Does
     * nothing if the appointment has no event.
     *
     * @param appointment updated appointment
     * @param newPrefix text placed before the child's name in the title
     * @throws RuntimeException if Google Calendar fails
     */
    public void updateAppointmentInCalendar(Appointment appointment, String newPrefix) {
        try {
            if (appointment.getGoogleEventId() == null || appointment.getGoogleEventId().isEmpty()) {
                return;
            }

            Calendar service = getCalendarService();

            Event event = service.events().get(calendarId, appointment.getGoogleEventId()).execute();

            event.setSummary(newPrefix + appointment.getChildName());

            service.events().update(calendarId, appointment.getGoogleEventId(), event).execute();

        } catch (Exception e) {
            throw new RuntimeException("Error updating the appointment in Google Calendar", e);
        }
    }

    /**
     * Moves the event of a rescheduled appointment. If the event no longer exists in Google, a new
     * one is created.
     *
     * @param appointment rescheduled appointment
     * @param newStartDateTime new start date and time
     * @throws RuntimeException if Google Calendar fails
     */
    public void rescheduleAppointmentInCalendar(Appointment appointment, LocalDateTime newStartDateTime) {
        try {
            if (appointment.getGoogleEventId() == null || appointment.getGoogleEventId().trim().isEmpty()) {
                log.warn("Appointment ID {} has no googleEventId. It will be created as a new event.",
                        appointment.getId());
                return;
            }

            Calendar service = getCalendarService();

            Event event;
            try {
                event = service.events().get(calendarId, appointment.getGoogleEventId()).execute();
            } catch (Exception e) {
                log.info("The event with Google ID '{}' was not found. A new one will be created.", appointment.getGoogleEventId());
                addAppointmentToCalendar(appointment);
                return;
            }

            LocalDateTime newEndDateTime = newStartDateTime.plusMinutes(59);
            String startIso = newStartDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();
            String endIso = newEndDateTime.atZone(ZoneId.systemDefault()).toInstant().toString();

            event.setStart(new EventDateTime().setDateTime(new DateTime(startIso)));
            event.setEnd(new EventDateTime().setDateTime(new DateTime(endIso)));

            event.setDescription("Cita Reprogramada\nPadre/Madre: " + appointment.getParentName() +
                    "\nTel: " + appointment.getParentPhone() +
                    "\nEmail: " + appointment.getParentEmail());

            service.events().update(calendarId, appointment.getGoogleEventId(), event).execute();
            log.info("Google Calendar event updated successfully for appointment ID: {}", appointment.getId());

        } catch (Exception e) {
            log.error("Critical error syncing the reschedule to Google Calendar for appointment ID {}",
                    appointment.getId(), e);
            throw new RuntimeException("Error updating the appointment in Google Calendar", e);
        }
    }

    /**
     * Creates a yearly, all-day birthday event that does not block the calendar and has no
     * reminders.
     *
     * @param teacher teacher with a birthday
     * @return the Google event ID
     * @throws IOException if Google Calendar fails
     * @throws GeneralSecurityException if the HTTPS transport cannot be created
     */
    public String createBirthdayEvent(User teacher) throws IOException, GeneralSecurityException {
        Calendar service = getCalendarService();
        Event created = service.events().insert(calendarId, buildBirthdayEvent(teacher)).execute();
        return created.getId();
    }

    /**
     * Updates a teacher's birthday event, or creates it again if it was deleted in Google.
     *
     * @param teacher teacher with a birthday and an event ID
     * @return the event ID, which is new if the event was recreated
     * @throws IOException if Google Calendar fails
     * @throws GeneralSecurityException if the HTTPS transport cannot be created
     */
    public String updateBirthdayEvent(User teacher) throws IOException, GeneralSecurityException {
        Calendar service = getCalendarService();
        try {
            service.events()
                    .update(calendarId, teacher.getBirthdayEventId(), buildBirthdayEvent(teacher))
                    .execute();
            return teacher.getBirthdayEventId();
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 404 || e.getStatusCode() == 410) {
                return createBirthdayEvent(teacher);
            }
            throw e;
        }
    }

    /**
     * Deletes a birthday event. An event that no longer exists is ignored.
     *
     * @param eventId Google event ID
     * @throws IOException if Google Calendar fails
     * @throws GeneralSecurityException if the HTTPS transport cannot be created
     */
    public void deleteBirthdayEvent(String eventId) throws IOException, GeneralSecurityException {
        Calendar service = getCalendarService();
        try {
            service.events().delete(calendarId, eventId).execute();
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() != 404 && e.getStatusCode() != 410)
                throw e;
        }
    }

    private Event buildBirthdayEvent(User teacher) {
        LocalDate next = nextBirthday(teacher.getBirthday());

        return new Event()
                .setSummary("Cumpleaños: " + teacher.getFirstName() + " " + teacher.getLastName())
                .setStart(new EventDateTime().setDate(new DateTime(next.toString())))
                .setEnd(new EventDateTime()
                        .setDate(new DateTime(next.plusDays(1).toString())))
                .setRecurrence(List.of("RRULE:FREQ=YEARLY"))
                .setTransparency("transparent")
                .setReminders(new Event.Reminders().setUseDefault(false));
    }

    /**
     * @param birthday date of birth
     * @return the next date (today included) on which the birthday falls, in Costa Rica time
     */
    private LocalDate nextBirthday(LocalDate birthday) {
        LocalDate today = LocalDate.now(CALENDAR_ZONE);
        LocalDate candidate = birthday.withYear(today.getYear());
        return candidate.isBefore(today) ? candidate.plusYears(1) : candidate;
    }
}