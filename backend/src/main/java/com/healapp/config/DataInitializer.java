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

import com.healapp.model.Category;
import com.healapp.model.CategoryQuestion;
import com.healapp.model.Gender;
import com.healapp.model.Role;
import com.healapp.model.STIService;
import com.healapp.model.ServiceTestComponent;
import com.healapp.model.UserDtls;
import com.healapp.repository.CategoryQuestionRepository;
import com.healapp.repository.CategoryRepository;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.STIPackageRepository;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.ServiceTestComponentRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class DataInitializer {

    @Value("${app.avatar.url.pattern}")
    private String avatarUrlPattern;

    @Value("${app.storage.type:local}")
    private String storageType;

    @Value("${gcs.bucket.name:}")
    private String gcsBucketName;

    private String getDefaultAvatarUrl() {
        // Nếu sử dụng GCS, trả về URL đầy đủ
        if ("gcs".equalsIgnoreCase(storageType) && gcsBucketName != null && !gcsBucketName.isEmpty()) {
            return String.format("https://storage.googleapis.com/%s/avatar/default.jpg", gcsBucketName);
        }
        
        // Local storage: sử dụng pattern như cũ
        String base = avatarUrlPattern;
        if (!base.endsWith("/")) {
            base += "/";
        }
        return base + "default.jpg";
    }

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
            defaultAdmin.setAvatar(getDefaultAvatarUrl());
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

    @Bean
    @Order(3)
    public CommandLineRunner initSampleData(
            @Autowired UserRepository userRepository,
            @Autowired RoleRepository roleRepository,
            @Autowired PasswordEncoder passwordEncoder,
            @Autowired CategoryRepository categoryRepository,
            @Autowired CategoryQuestionRepository categoryQuestionRepository,
            @Autowired STIServiceRepository stiServiceRepository,
            @Autowired ServiceTestComponentRepository serviceTestComponentRepository,
            @Autowired STIPackageRepository stiPackageRepository) {
        return args -> {
            // 1. Tạo 4 account
            createUserIfNotExists(userRepository, roleRepository, passwordEncoder, "customer1", "Customer123@", "customer1@gmail.com", "CUSTOMER", "Customer 1");
            createUserIfNotExists(userRepository, roleRepository, passwordEncoder, "consultant1", "Consultant123@", "consultant1@gmail.com", "CONSULTANT", "Consultant 1");
            createUserIfNotExists(userRepository, roleRepository, passwordEncoder, "staff1", "Staff123@", "staff1@gmail.com", "STAFF", "Staff 1");
            // Admin đã tạo ở initDefaultAdmin

            // 2. Tạo 5 category và 5 category question cho mỗi loại
            for (int i = 1; i <= 5; i++) {
                String catName = "Category " + i;
                Category category = categoryRepository.findByName(catName).orElseGet(() -> {
                    Category c = new Category();
                    c.setName(catName);
                    c.setDescription("Mô tả cho " + catName);
                    c.setIsActive(true);
                    return categoryRepository.save(c);
                });
                for (int j = 1; j <= 5; j++) {
                    String qName = "Câu hỏi " + j + " cho " + catName;
                    if (!categoryQuestionRepository.existsByName(qName)) {
                        CategoryQuestion cq = new CategoryQuestion();
                        cq.setName(qName);
                        cq.setDescription("Mô tả cho " + qName);
                        cq.setIsActive(true);
                        categoryQuestionRepository.save(cq);
                    }
                }
            }

            // 3. Tạo 5 service lẻ
            String[] serviceNames = {"Xét nghiệm HIV", "Xét nghiệm Giang mai", "Xét nghiệm Lậu", "Xét nghiệm Sùi mào gà", "Xét nghiệm Viêm gan B"};
            STIService[] services = new STIService[5];
            for (int i = 0; i < 5; i++) {
                final String sName = serviceNames[i];
                final int idx = i;
                final int testIdx = i;
                services[i] = stiServiceRepository.findByNameIgnoreCase(sName).orElseGet(() -> {
                    STIService s = new STIService();
                    s.setName(sName);
                    s.setDescription("Dịch vụ " + sName);
                    s.setPrice(200000.0 + idx * 50000.0);
                    s.setIsActive(true);
                    STIService saved = stiServiceRepository.save(s);
                    // Tạo 2 test component cho mỗi service với reference range thực tế
                    for (int j = 1; j <= 2; j++) {
                        ServiceTestComponent c = new ServiceTestComponent();
                        c.setStiService(saved);
                        c.setTestName(sName + " - Component " + j);
                        // Reference range thực tế cho từng loại test
                        String ref;
                        switch (testIdx) {
                            case 0: ref = "Negative"; break; // HIV
                            case 1: ref = "Not detected"; break; // Giang mai
                            case 2: ref = "Not detected"; break; // Lậu
                            case 3: ref = "Negative"; break; // Sùi mào gà
                            case 4: ref = "< 1.0 IU/mL"; break; // Viêm gan B
                            default: ref = "Normal";
                        }
                        c.setReferenceRange(ref);
                        serviceTestComponentRepository.save(c);
                    }
                    return saved;
                });
            }

            // 4. BỎ QUA tạo 2 package từ 5 service đã có
            // (Không tạo dữ liệu mẫu cho package để tránh lỗi bảng join)
        };
    }

    private void createUserIfNotExists(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, String username, String password, String email, String roleName, String fullName) {
        if (userRepository.existsByUsername(username)) return;
        Role role = roleRepository.findByRoleName(roleName).orElse(null);
        if (role == null) return;
        UserDtls user = new UserDtls();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setFullName(fullName);
        user.setGender(Gender.OTHER);
        user.setBirthDay(LocalDate.of(1995, 1, 1));
        user.setRole(role);
        user.setAvatar(getDefaultAvatarUrl());
        user.setIsActive(true);
        user.setCreatedDate(LocalDateTime.now());
        userRepository.save(user);
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
