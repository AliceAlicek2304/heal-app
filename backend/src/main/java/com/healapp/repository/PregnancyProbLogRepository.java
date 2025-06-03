package com.healapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.healapp.model.PregnancyProbLog;

@Repository
public interface PregnancyProbLogRepository extends JpaRepository<PregnancyProbLog, Long> {

    // Tìm tất cả bản ghi xác suất mang thai theo id chu kỳ kinh nguyệt
    Optional<List<PregnancyProbLog>> findAllByMenstrualCycleId(Long menstrualCycleId);

    // Tìm bản ghi xác suất mang thai theo id
    Optional<PregnancyProbLog> findById(Long id);

    // Xóa bản ghi xác suất mang thai theo id
    void deleteById(Long id);

    //Lưu bản ghi xác suất mang thai theo id chu kỳ kinh nguyệt
    PregnancyProbLog save(PregnancyProbLog pregnancyProbLog);

    // Xóa các bản ghi xác suất mang thai theo id chu kỳ kinh nguyệt
    void deleteAllByMenstrualCycleId(Long menstrualCycleId);
}