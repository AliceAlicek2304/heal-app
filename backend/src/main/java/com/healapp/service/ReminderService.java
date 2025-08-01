package com.healapp.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.healapp.model.Consultation;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.MenstrualCycle;
import com.healapp.model.STITest;
import com.healapp.model.TestStatus;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultationRepository;
import com.healapp.repository.MenstrualCycleRepository;
import com.healapp.repository.STITestRepository;
import com.healapp.utils.TimeZoneUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ReminderService {

    @Autowired
    private MenstrualCycleRepository menstrualCycleRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private STITestRepository stiTestRepository;

    @Scheduled(cron = "0 0 8 * * ?") // Runs every day at 8:00 AM Vietnam time
    public void sendOvulationReminders() {
        // Get current time in Vietnam timezone
        log.info("Start checking and sending ovulation reminders at {} (Vietnam time)", TimeZoneUtils.getCurrentTimeForLog());

        LocalDate tomorrow = TimeZoneUtils.tomorrowVietnam();
        log.info("Checking for ovulation reminders on: {}", tomorrow);

        List<MenstrualCycle> cycles = menstrualCycleRepository.findByReminderEnabledTrueAndOvulationDate(tomorrow);

        log.info("Found {} cycles to send ovulation reminders", cycles.size());

        for (MenstrualCycle cycle : cycles) {
            UserDtls user = cycle.getUser();
            try {
                emailService.sendOvulationReminderAsync(
                        user.getEmail(),
                        user.getFullName(),
                        cycle.getOvulationDate());
                log.info("Sent ovulation reminder to user ID: {}", user.getId());
            } catch (Exception e) {
                log.error("Error sending ovulation reminder to user ID: {}: {}",
                        user.getId(), e.getMessage(), e);
            }
        }

        // Send consultation reminders
        sendConsultationRemindersForTomorrow();
        // Send STI test reminders
        sendSTITestRemindersForTomorrow();

        log.info("Completed sending ovulation, consultation, and STI test reminders");
    }

    public void sendConsultationRemindersForTomorrow() {
        // Get tomorrow's date in Vietnam timezone
        LocalDate tomorrow = TimeZoneUtils.tomorrowVietnam();
        
        LocalDateTime start = tomorrow.atStartOfDay();
        LocalDateTime end = start.plusDays(1).minusSeconds(1);
        
        log.info("Checking consultation reminders for tomorrow: {} (Vietnam time)", tomorrow);
        
        List<Consultation> consultationsRaw = consultationRepository
            .findByStatus(ConsultationStatus.CONFIRMED)
            .stream()
            .filter(c -> c.getStartTime() != null && !c.getStartTime().isBefore(start) && !c.getStartTime().isAfter(end))
            .toList();
            
        log.info("Found {} CONFIRMED consultations scheduled for tomorrow", consultationsRaw.size());
        
        for (Consultation c : consultationsRaw) {
            try {
                emailService.sendConsultationReminderAsync(c);
                log.info("Sent consultation reminder to user ID: {} for consultation at {}", 
                        c.getCustomer().getId(), c.getStartTime());
            } catch (Exception e) {
                log.error("Error sending consultation reminder to user ID: {}: {}", 
                        c.getCustomer().getId(), e.getMessage(), e);
            }
        }
    }

    public void sendSTITestRemindersForTomorrow() {
        // Get tomorrow's date in Vietnam timezone
        LocalDate tomorrow = TimeZoneUtils.tomorrowVietnam();
        
        LocalDateTime start = tomorrow.atStartOfDay();
        LocalDateTime end = start.plusDays(1).minusSeconds(1);
        
        log.info("Checking STI test reminders for tomorrow: {} (Vietnam time)", tomorrow);
        
        List<STITest> tests = stiTestRepository.findConfirmedTestsWithDetails(TestStatus.CONFIRMED, start, end);
        log.info("Found {} CONFIRMED STI tests scheduled for tomorrow", tests.size());
        
        for (STITest t : tests) {
            try {
                String email = t.getCustomer() != null ? t.getCustomer().getEmail() : null;
                String fullName = t.getCustomer() != null ? t.getCustomer().getFullName() : null;
                String serviceName = t.getStiService() != null ? t.getStiService().getName() : null;
                String packageName = t.getStiPackage() != null ? t.getStiPackage().getPackageName() : null;
                LocalDateTime appointmentDate = t.getAppointmentDate();
                
                emailService.sendSTITestReminderAsync(email, fullName, serviceName, packageName, appointmentDate);
                log.info("Sent STI test reminder to user: {} for appointment at {}", email, appointmentDate);
            } catch (Exception e) {
                log.error("Error sending STI test reminder to user: {}: {}", 
                        t.getCustomer() != null ? t.getCustomer().getId() : null, e.getMessage(), e);
            }
        }
    }
}