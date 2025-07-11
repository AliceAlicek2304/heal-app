package com.healapp.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.healapp.model.AuthProvider;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;

@Repository
public interface UserRepository extends JpaRepository<UserDtls, Long> {

    Optional<UserDtls> findByUsername(String username);

    Optional<UserDtls> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<UserDtls> findByUsernameOrEmail(String username, String email);

    List<UserDtls> findByRole(Role role);

    @Query("SELECT u FROM UserDtls u WHERE u.role.roleName = :roleName")
    List<UserDtls> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT u FROM UserDtls u WHERE u.role.roleName = :roleName AND u.isActive = :isActive")
    List<UserDtls> findByRoleNameAndIsActive(@Param("roleName") String roleName, @Param("isActive") Boolean isActive);

    Iterable<UserDtls> findByIsActive(Boolean isActive);

    Iterable<UserDtls> findByFullNameContainingIgnoreCase(String name);

    LocalDate findBirthDayById(Long id);

    Long countByRole(Role role);

    List<UserDtls> findByRoleAndIsActive(Role role, boolean isActive);

    @Query("SELECT u FROM UserDtls u WHERE u.role.roleName IN :roleNames")
    List<UserDtls> findByRoleNameIn(@Param("roleNames") List<String> roleNames);

    @Query("SELECT u FROM UserDtls u WHERE u.role.roleName = :roleName ORDER BY u.createdDate DESC")
    List<UserDtls> findByRoleNameOrderByCreatedDateDesc(@Param("roleName") String roleName);

    // OAuth-related methods
    Optional<UserDtls> findByEmailAndProvider(String email, AuthProvider provider);
}