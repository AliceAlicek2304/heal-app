package com.healapp.repository;

import com.healapp.model.PackageService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PackageServiceRepository extends JpaRepository<PackageService, Long> {
    
    @Modifying
    @Transactional
    @Query("DELETE FROM PackageService ps WHERE ps.stiPackage.packageId = :packageId")
    void deleteByPackageId(@Param("packageId") Long packageId);
}
