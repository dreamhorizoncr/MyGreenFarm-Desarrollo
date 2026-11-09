package taller.multimedia.backend.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import taller.multimedia.backend.model.user.User;
import taller.multimedia.backend.repository.user.UserRepository;

@Service
public class BirthdayReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(BirthdayReminderScheduler.class);
    private static final ZoneId COSTA_RICA_ZONE = ZoneId.of("America/Costa_Rica");

    private final UserRepository userRepository;
    private final EmailService emailService;

    public BirthdayReminderScheduler(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Scheduled(cron = "0 33 11 * * *", zone = "America/Costa_Rica")
    public void sendBirthdayGreetings() {
        LocalDate birthdayDate = LocalDate.now(COSTA_RICA_ZONE);
        List<User> teachers = findTeachersWithBirthdayOn(birthdayDate);

        for (User teacher : teachers) {
            emailService.sendBirthdayGreetingEmail(teacher, birthdayDate, Locale.forLanguageTag("es"));
        }

        if (!teachers.isEmpty()) {
            log.info("Birthday greetings scheduled for {} teacher(s) on {}",
                    teachers.size(), birthdayDate);
        }
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "America/Costa_Rica")
    public void sendTomorrowBirthdayReminder() {
        LocalDate birthdayDate = LocalDate.now(COSTA_RICA_ZONE).plusDays(1);
        List<User> teachers = findTeachersWithBirthdayOn(birthdayDate);

        if (teachers.isEmpty()) {
            log.debug("No teacher birthdays on {}", birthdayDate);
            return;
        }

        emailService.sendBirthdayReminderEmail(teachers, birthdayDate, Locale.forLanguageTag("es"));
        log.info("Birthday reminder scheduled for {} teacher(s) on {}",
                teachers.size(), birthdayDate);
    }

    private List<User> findTeachersWithBirthdayOn(LocalDate birthdayDate) {
        return userRepository.findTeachersWithBirthdayOn(
                birthdayDate.getMonthValue(),
                birthdayDate.getDayOfMonth());
    }
}
