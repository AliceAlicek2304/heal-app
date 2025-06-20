package com.healapp.dto;

import lombok.Data;

@Data
public class BlogSectionResponse {
    private Long id;
    private String sectionTitle;
    private String sectionContent;
    private String sectionImage;
    private Integer displayOrder;
}
