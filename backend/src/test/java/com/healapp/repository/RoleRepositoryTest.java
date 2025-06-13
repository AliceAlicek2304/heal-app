package com.healapp.repository;

import com.healapp.model.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class RoleRepositoryTest {

    @Autowired
    private RoleRepository roleRepository;

    // Test that verifies both data.sql and DataInitializer are working correctly
    @Test
    public void testRoleInitialization() {
        // Check that all expected roles exist
        List<Role> allRoles = roleRepository.findAll();
        assertThat(allRoles).isNotEmpty();

        // We should have at least our 4 default roles
        assertThat(allRoles.size()).isGreaterThanOrEqualTo(4);

        // Check if all default roles exist
        List<String> defaultRoles = Arrays.asList("CUSTOMER", "CONSULTANT", "STAFF", "ADMIN");
        for (String roleName : defaultRoles) {
            boolean roleExists = allRoles.stream()
                    .anyMatch(role -> role.getRoleName().equals(roleName));
            assertThat(roleExists).isTrue();
        }
    }

    @Test
    public void shouldFindDefaultRoles() {
        // Test all four default roles exist
        List<String> expectedRoleNames = Arrays.asList("CUSTOMER", "CONSULTANT", "STAFF", "ADMIN");

        for (String roleName : expectedRoleNames) {
            Optional<Role> role = roleRepository.findByRoleName(roleName);
            assertThat(role).isPresent()
                    .withFailMessage("Default role " + roleName + " should exist in database");
            // Just verify that roles exist and have descriptions, without being too
            // specific about the content
            if (roleName.equals("CUSTOMER")) {
                assertThat(role.get().getDescription()).isEqualTo("Regular customer role for general users");
            } else if (roleName.equals("ADMIN")) {
                assertThat(role.get().getDescription()).isEqualTo("Administrator role with full system access");
            } else if (roleName.equals("STAFF")) {
                assertThat(role.get().getDescription())
                        .isEqualTo("Staff role for administrative and healthcare support");
            } else if (roleName.equals("CONSULTANT")) {
                assertThat(role.get().getDescription().toLowerCase()).contains("consultant");
            }
        }
    }

    @Test
    public void shouldFindByRoleName() {
        // Test finding a specific role
        Optional<Role> adminRole = roleRepository.findByRoleName("ADMIN");
        assertThat(adminRole).isPresent();
        assertThat(adminRole.get().getRoleName()).isEqualTo("ADMIN");
        assertThat(adminRole.get().getDescription()).isEqualTo("Administrator role with full system access");
    }
}
