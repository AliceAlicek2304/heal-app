package com.healapp.repository;

import com.healapp.model.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppConfigRepository extends JpaRepository<AppConfig, String> {

    // Tìm config theo key và active
    Optional<AppConfig> findByConfigKeyAndIsActiveTrue(String configKey);

    // Lấy tất cả config active
    List<AppConfig> findByIsActiveTrueOrderByConfigKey();

    // Tìm theo pattern key
    @Query("SELECT a FROM AppConfig a WHERE a.configKey LIKE :pattern AND a.isActive = true ORDER BY a.configKey")
    List<AppConfig> findByConfigKeyPattern(@Param("pattern") String pattern);

    // Kiểm tra key có tồn tại không
    boolean existsByConfigKeyAndIsActiveTrue(String configKey);

    // Lấy config theo prefix (ví dụ: social.*)
    @Query("SELECT a FROM AppConfig a WHERE a.configKey LIKE :prefix% AND a.isActive = true ORDER BY a.configKey")
    List<AppConfig> findByConfigKeyPrefix(@Param("prefix") String prefix);

    Optional<AppConfig> findByConfigKey(String configKey);
}