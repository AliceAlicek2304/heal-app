package com.healapp.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Long userId;
    private String question;
    private String answer;
    private LocalDateTime timestamp;
}