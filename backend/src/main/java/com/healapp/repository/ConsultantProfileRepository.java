package com.healapp.repository;

import com.healapp.model.ConsultantProfile;
import com.healapp.model.UserDtls;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsultantProfileRepository extends JpaRepository<ConsultantProfile, Long> {
    Optional<ConsultantProfile> findByUser(UserDtls user);

    @Query("SELECT cp FROM ConsultantProfile cp WHERE cp.user.id = :userId")
    Optional<ConsultantProfile> findByUserId(Long userId);
}