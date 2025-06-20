package com.healapp.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.model.MenstrualCycle;
import com.healapp.model.PregnancyProbLog;
import com.healapp.repository.MenstrualCycleRepository;
import com.healapp.repository.PregnancyProbLogRepository;

@Service
public class PregnancyProbLogService {
    @Autowired
    private PregnancyProbLogRepository pregnancyProbLogRepository;

    @Autowired
    private MenstrualCycleRepository menstrualCycleRepository;

    // tính ngày bắt đầu có tỉ lệ mang thai cao dự vào chu kỳ kinh nguyệt
    public LocalDate findStartDateOfCycle(Long menstrualCycleId) {
        // lấy chu kỳ kinh nguyệt theo id
        MenstrualCycle menstrualCycle = menstrualCycleRepository.findById(menstrualCycleId)
                .orElseThrow(() -> new IllegalArgumentException("Menstrual cycle not found"));

        // tính ngày bắt đầu có tỉ lệ mang thai cao
        // trước ngày rụng trứng 5 ngày
        LocalDate startDate = menstrualCycle.getStartDate().plusDays(menstrualCycle.getCycleLength() - 19);

        return startDate;
    }

    // cập nhật tỉ lệ mang thai khi thêm, cập nhật chu kỳ kinh nguyệt
    public ApiResponse<Void> updatePregnancyProbability(Long menstrualCycleId) {
        try{
            //kiểm tra chu kỳ kinhg nguyệt có tồn tại hay không
            Optional<MenstrualCycle> optionalCycle = menstrualCycleRepository.findById(menstrualCycleId);
            if (!optionalCycle.isPresent()) {
                throw new IllegalArgumentException("Menstrual cycle not found");
            }

            //kiểm tra chu kỳ kinh nguyệt có log chưa
            Optional<List<PregnancyProbLog>> logs = pregnancyProbLogRepository.findAllByMenstrualCycleId(menstrualCycleId);
            if (logs.isPresent()) {
                // nếu đã có log thì xóa hết log cũ
                pregnancyProbLogRepository.deleteAll(logs.get());
            }

            // cập nhật log mới cho dữ liệu chu kỳ mới
            //Ngày 1
            PregnancyProbLog pregnancyProbLog1 = new PregnancyProbLog();
            pregnancyProbLog1.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog1.setDate(findStartDateOfCycle(menstrualCycleId));
            pregnancyProbLog1.setProbability(6.4);
            pregnancyProbLogRepository.save(pregnancyProbLog1);

            //Ngày 2    
            PregnancyProbLog pregnancyProbLog2 = new PregnancyProbLog();
            pregnancyProbLog2.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog2.setDate(findStartDateOfCycle(menstrualCycleId).plusDays(1));
            pregnancyProbLog2.setProbability(7.8);
            pregnancyProbLogRepository.save(pregnancyProbLog2);

            //Ngày 3
            PregnancyProbLog pregnancyProbLog3 = new PregnancyProbLog();
            pregnancyProbLog3.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog3.setDate(findStartDateOfCycle(menstrualCycleId).plusDays(2));
            pregnancyProbLog3.setProbability(10.7);
            pregnancyProbLogRepository.save(pregnancyProbLog3);

            //Ngày 4
            PregnancyProbLog pregnancyProbLog4 = new PregnancyProbLog();
            pregnancyProbLog4.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog4.setDate(findStartDateOfCycle(menstrualCycleId).plusDays(3));
            pregnancyProbLog4.setProbability(19.3);
            pregnancyProbLogRepository.save(pregnancyProbLog4);

            //Ngày 5
            PregnancyProbLog pregnancyProbLog5 = new PregnancyProbLog();
            pregnancyProbLog5.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog5.setDate(findStartDateOfCycle(menstrualCycleId).plusDays(4));
            pregnancyProbLog5.setProbability(23.5);
            pregnancyProbLogRepository.save(pregnancyProbLog5);

            //Ngày 6
            PregnancyProbLog pregnancyProbLog6 = new PregnancyProbLog();
            pregnancyProbLog6.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog6.setDate(findStartDateOfCycle(menstrualCycleId).plusDays(5));
            pregnancyProbLog6.setProbability(15.7);
            pregnancyProbLogRepository.save(pregnancyProbLog6);

            //Ngày 7
            PregnancyProbLog pregnancyProbLog7 = new PregnancyProbLog();
            pregnancyProbLog7.setMenstrualCycle(optionalCycle.get());
            pregnancyProbLog7.setDate(findStartDateOfCycle(menstrualCycleId).plusDays(6));
            pregnancyProbLog7.setProbability(5.7);
            pregnancyProbLogRepository.save(pregnancyProbLog7);

            return ApiResponse.success("Add pregnancy probability successfully!");

        } catch (Exception e) {
            return ApiResponse.error("Error updating pregnancy probability: " + e.getMessage());
        }
    }

    // Xóa log xác suất mang thai khi xóa chu kỳ kinh nguyệt
    public ApiResponse<Void> deletePregnancyProbLog(Long menstrualCycleId) {
        try {
            // Kiểm tra chu kỳ kinh nguyệt có tồn tại hay không
            Optional<MenstrualCycle> optionalCycle = menstrualCycleRepository.findById(menstrualCycleId);
            if (!optionalCycle.isPresent()) {
                throw new IllegalArgumentException("Menstrual cycle not found");
            }

            // Kiểm tra xem có log xác suất mang thai nào không
            Optional<List<PregnancyProbLog>> logs = pregnancyProbLogRepository.findAllByMenstrualCycleId(menstrualCycleId);

            // Xóa tất cả log xác suất mang thai theo id chu kỳ kinh nguyệt
            if (logs.isPresent() && !logs.get().isEmpty()) {
                pregnancyProbLogRepository.deleteAll(logs.get());
                return ApiResponse.success("Delete pregnancy probability log successfully!");
            } else {
                return ApiResponse.success("No pregnancy probability logs found for this menstrual cycle.");
            }
        } catch (Exception e) {
            return ApiResponse.error("Error deleting pregnancy probability log: " + e.getMessage());
        }
    }
}
