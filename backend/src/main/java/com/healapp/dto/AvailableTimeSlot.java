package com.healapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailableTimeSlot {

    private String slot; // "8-10", "10-12", "13-15", "15-17"
    private boolean available;
}