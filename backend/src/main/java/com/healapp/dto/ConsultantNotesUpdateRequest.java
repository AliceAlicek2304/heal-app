package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ConsultantNotesUpdateRequest {

    @NotBlank(message = "Consultant notes cannot be empty")
    @Size(max = 2000, message = "Consultant notes cannot exceed 2000 characters")
    private String consultantNotes;

    public ConsultantNotesUpdateRequest() {
    }

    public ConsultantNotesUpdateRequest(String consultantNotes) {
        this.consultantNotes = consultantNotes;
    }

    public String getConsultantNotes() {
        return consultantNotes;
    }

    public void setConsultantNotes(String consultantNotes) {
        this.consultantNotes = consultantNotes;
    }
}