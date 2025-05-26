package com.healapp.repository;

import com.healapp.model.UserDtls;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<UserDtls, Long> {

    Optional<UserDtls> findByUsername(String username);

    Optional<UserDtls> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<UserDtls> findByUsernameOrEmail(String username, String email);

    List<UserDtls> findByRole(String role);

    Iterable<UserDtls> findByIsActive(Boolean isActive);

    Iterable<UserDtls> findByFullNameContainingIgnoreCase(String name);

    LocalDate findBirthDayById(Long id);

    Long countByRole(String role);

    List<UserDtls> findByRoleAndIsActive(String role, boolean isActive);

    List<UserDtls> findByRoleIn(List<String> roles);

    List<UserDtls> findByRoleOrderByCreatedDateDesc(String role);
}