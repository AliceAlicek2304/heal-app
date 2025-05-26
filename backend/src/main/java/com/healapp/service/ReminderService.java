package com.healapp.service;

import com.healapp.model.MenstrualCycle;
import com.healapp.model.UserDtls;
import com.healapp.repository.MenstrualCycleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class ReminderService {

    @Autowired
    private MenstrualCycleRepository menstrualCycleRepository;

    @Autowired
    private EmailService emailService;
    @Scheduled(cron = "0 0 8 * * ?") // Chạy mỗi ngày lúc 8:00 sáng
    public void sendOvulationReminders() {
        log.info("Bắt đầu kiểm tra và gửi nhắc nhở ngày rụng trứng");

        LocalDate tomorrow = LocalDate.now().plusDays(1);

        // Tìm tất cả chu kỳ có reminderEnabled = true và ngày rụng trứng là ngày mai
        List<MenstrualCycle> cycles = menstrualCycleRepository.findByReminderEnabledTrueAndOvulationDate(tomorrow);

        log.info("Tìm thấy {} chu kỳ cần gửi nhắc nhở", cycles.size());

        for (MenstrualCycle cycle : cycles) {
            UserDtls user = cycle.getUser();
            try {
                emailService.sendOvulationReminderAsync(
                        user.getEmail(),
                        user.getFullName(),
                        cycle.getOvulationDate());
                log.info("Đã gửi nhắc nhở ngày rụng trứng cho user ID: {}", user.getId());
            } catch (Exception e) {
                log.error("Lỗi khi gửi nhắc nhở ngày rụng trứng cho user ID: {}: {}",
                        user.getId(), e.getMessage(), e);
            }
        }

        log.info("Hoàn thành gửi nhắc nhở ngày rụng trứng");
    }
}