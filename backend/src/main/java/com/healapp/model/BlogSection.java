package com.healapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "blog_sections")
public class BlogSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "section_id")
    private Long sectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private BlogPost blogPost;

    @Column(nullable = false, columnDefinition = "nvarchar(MAX)")
    private String sectionTitle;

    @Column(columnDefinition = "nvarchar(MAX)", nullable = false)
    private String sectionContent;

    @Column(name = "section_image")
    private String sectionImage;

    // Thứ tự hiển thị của section trong bài viết
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
