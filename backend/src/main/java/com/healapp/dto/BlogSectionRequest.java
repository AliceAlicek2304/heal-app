package com.healapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BlogSectionRequest {
    
    private String sectionTitle;

    @NotBlank(message = "Section content is required")
    private String sectionContent;
    
    private String sectionImage;
    
    @NotNull(message = "Display order is required")
    private Integer displayOrder;
}
