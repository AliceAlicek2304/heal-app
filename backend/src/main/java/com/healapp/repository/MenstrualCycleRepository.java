package com.healapp.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.healapp.model.MenstrualCycle;

@Repository
public interface MenstrualCycleRepository extends JpaRepository<MenstrualCycle, Long> {

    // tìm tất cả chu kỳ kinh nguyệt theo userId
    List<MenstrualCycle> findAllByUserId(Long userId);

    // tìm chu kỳ kinh nguyệt theo id
    Optional<MenstrualCycle> findById(Long id);

    // xóa chu kỳ kinh nguyệt theo id
    void deleteById(Long id);

    List<MenstrualCycle> findByReminderEnabledTrueAndOvulationDate(LocalDate ovulationDate);
}
