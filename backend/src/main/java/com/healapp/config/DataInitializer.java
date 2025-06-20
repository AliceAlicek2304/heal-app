package com.healapp.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.healapp.model.Gender;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class DataInitializer {

    @Value("${app.avatar.url.pattern}default.jpg")
    private String defaultAvatarPath;

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

    @Bean
    @Order(2) // Run after roles are initialized
    public CommandLineRunner initDefaultAdmin(
            @Autowired UserRepository userRepository,
            @Autowired RoleRepository roleRepository,
            @Autowired PasswordEncoder passwordEncoder) {
        return args -> {
            log.info("Checking for default admin user...");
            
            // Check if any admin user exists
            Optional<Role> adminRole = roleRepository.findByRoleName("ADMIN");
            if (adminRole.isEmpty()) {
                log.error("ADMIN role not found! Cannot create default admin user.");
                return;
            }

            // Check if any admin user already exists
            long adminCount = userRepository.countByRole(adminRole.get());
            if (adminCount > 0) {
                log.info("Admin user(s) already exist. Skipping default admin creation.");
                return;
            }

            // Create default admin user
            log.info("No admin users found. Creating default admin user...");
            
            UserDtls defaultAdmin = new UserDtls();
            defaultAdmin.setUsername("admin123");
            defaultAdmin.setPassword(passwordEncoder.encode("Admin123@"));
            defaultAdmin.setEmail("alicek23004@gmail.com");
            defaultAdmin.setFullName("Default Admin");
            defaultAdmin.setGender(Gender.OTHER); // Default to OTHER for admin
            defaultAdmin.setBirthDay(LocalDate.of(1990, 1, 1)); // Default birth date
            defaultAdmin.setRole(adminRole.get());
            defaultAdmin.setAvatar(defaultAvatarPath);
            defaultAdmin.setIsActive(true);
            defaultAdmin.setCreatedDate(LocalDateTime.now());
            
            userRepository.save(defaultAdmin);
            
            log.info("✅ Default admin user created successfully!");
            log.info("Username: admin123");
            log.info("Password: Admin123@");
            log.info("Email: alicek23004@gmail.com");
            log.info("🔐 Please change the default password after first login for security!");
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
