package com.healapp.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenstrualCycleRequest {
    @NotNull(message = "Ngày bắt đầu chu kỳ kinh nguyệt gần nhất là bắt buộc")
    @Past(message = "Ngày bắt đầu chu kỳ kinh nguyệt gần nhất phải là ngày trong quá khứ")
    private LocalDate startDate;

    @NotNull(message = "Số ngày hành kinh là bắt buộc")
    @Min(value = 1, message = "Số ngày hành kinh phải lớn hơn hoặc bằng 1")
    private long numberOfDays;

    @NotNull(message = "Độ dài chu kỳ là bắt buộc") 
    @Min(value = 1, message = "Độ dài chu kỳ phải lớn hơn hoặc bằng 1")
    private long cycleLength;
}
