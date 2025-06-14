package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffReplyRequest {

    @NotBlank(message = "Staff reply is required")
    @Size(max = 500, message = "Staff reply must not exceed 500 characters")
    private String staffReply;
}
