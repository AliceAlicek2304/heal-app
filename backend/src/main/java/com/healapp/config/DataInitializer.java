package com.healapp.config;

import com.healapp.model.Role;
import com.healapp.repository.RoleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.time.LocalDateTime;
import java.util.Optional;

@Configuration
@Slf4j
public class DataInitializer {

    @Bean
    @Order(1) // Ensure this runs first, before any other initialization
    public CommandLineRunner initRoles(@Autowired RoleRepository roleRepository) {
        return args -> {
            log.info("Initializing default roles...");
            // CUSTOMER role
            insertOrUpdateRole(roleRepository, "CUSTOMER", "Regular customer role");

            // CONSULTANT role
            insertOrUpdateRole(roleRepository, "CONSULTANT", "Consultant role");

            // STAFF role
            insertOrUpdateRole(roleRepository, "STAFF", "Staff role");

            // ADMIN role
            insertOrUpdateRole(roleRepository, "ADMIN", "Administrator role");

            log.info("Role initialization completed successfully.");
        };
    }

    private void insertOrUpdateRole(RoleRepository repository, String roleName, String description) {
        Optional<Role> existingRole = repository.findByRoleName(roleName);

        if (existingRole.isPresent()) {
            Role role = existingRole.get();
            role.setDescription(description);
            role.setUpdatedAt(LocalDateTime.now());
            repository.save(role);
            log.info("Updated existing role: {}", roleName);
        } else {
            Role newRole = new Role(roleName, description);
            repository.save(newRole);
            log.info("Created new role: {}", roleName);
        }
    }
}
