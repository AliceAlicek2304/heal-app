package com.healapp.dto;

import lombok.Data;

@Data
public class BlogSectionResponse {
    private Long id;
    private String sectionTitle;
    private String sectionContent;
    private String sectionImage;
    private String existingSectionImage;
    private Integer displayOrder;

    public String getExistingSectionImage() {
        return existingSectionImage;
    }

    public void setExistingSectionImage(String existingSectionImage) {
        this.existingSectionImage = existingSectionImage;
    }

    // Đảm bảo luôn trả về existingSectionImage nếu sectionImage null (giúp frontend hiển thị đúng ảnh cũ)
    public String getDisplaySectionImage() {
        return sectionImage != null ? sectionImage : existingSectionImage;
    }
}
