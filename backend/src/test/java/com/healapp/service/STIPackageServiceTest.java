package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STIPackageRequest;
import com.healapp.dto.STIPackageResponse;
import com.healapp.model.*;
import com.healapp.repository.STIPackageRepository;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.UserRepository;
import com.healapp.repository.PackageServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử dịch vụ quản lý STI Package")
class STIPackageServiceTest {
    @Mock
    private STIPackageRepository stiPackageRepository;

    @Mock
    private STIServiceRepository stiServiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PackageServiceRepository packageServiceRepository;

    @InjectMocks
    private STIPackageService stiPackageService;

    // Test data
    private UserDtls adminUser;
    private UserDtls staffUser;
    private UserDtls regularUser;
    private STIService service1;
    private STIService service2;
    private STIPackage stiPackage;
    private STIPackageRequest validRequest;
    private Role adminRole;
    private Role staffRole;
    private Role userRole;
    private List<ServiceTestComponent> components1;
    private List<ServiceTestComponent> components2;

    @BeforeEach
    void setUp() { // Initialize Roles
        adminRole = new Role();
        adminRole.setRoleId(1L);
        adminRole.setRoleName("ROLE_ADMIN");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");

        userRole = new Role();
        userRole.setRoleId(3L);
        userRole.setRoleName("USER");

        // Initialize Users
        adminUser = new UserDtls();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setFullName("Admin User");
        adminUser.setRole(adminRole);

        staffUser = new UserDtls();
        staffUser.setId(2L);
        staffUser.setUsername("staff");
        staffUser.setFullName("Staff User");
        staffUser.setRole(staffRole);

        regularUser = new UserDtls();
        regularUser.setId(3L);
        regularUser.setUsername("user");
        regularUser.setFullName("Regular User");
        regularUser.setRole(userRole);

        // Initialize Test Components
        components1 = new ArrayList<>();
        ServiceTestComponent comp1 = new ServiceTestComponent();
        comp1.setComponentId(1L);
        comp1.setTestName("HIV Test");
        comp1.setReferenceRange("Negative");

        ServiceTestComponent comp2 = new ServiceTestComponent();
        comp2.setComponentId(2L);
        comp2.setTestName("Hepatitis B Test");
        comp2.setReferenceRange("Negative");

        components1.add(comp1);
        components1.add(comp2);

        components2 = new ArrayList<>();
        ServiceTestComponent comp3 = new ServiceTestComponent();
        comp3.setComponentId(3L);
        comp3.setTestName("Syphilis Test");
        comp3.setReferenceRange("Non-reactive");

        components2.add(comp3);

        // Initialize Services
        service1 = new STIService();
        service1.setServiceId(1L);
        service1.setName("STI Comprehensive Test");
        service1.setDescription("Complete STI screening");
        service1.setPrice(500000.0);
        service1.setIsActive(true);
        service1.setTestComponents(components1);
        service1.setCreatedAt(LocalDateTime.now().minusDays(5));
        service1.setUpdatedAt(LocalDateTime.now().minusDays(1));

        service2 = new STIService();
        service2.setServiceId(2L);
        service2.setName("STI Basic Test");
        service2.setDescription("Basic STI screening");
        service2.setPrice(300000.0);
        service2.setIsActive(true);
        service2.setTestComponents(components2);
        service2.setCreatedAt(LocalDateTime.now().minusDays(3));
        service2.setUpdatedAt(LocalDateTime.now().minusDays(1));

        // Initialize Package
        List<STIService> packageServices = Arrays.asList(service1, service2);

        stiPackage = new STIPackage();
        stiPackage.setPackageId(1L);
        stiPackage.setPackageName("STI Combo Package");
        stiPackage.setDescription("Comprehensive STI testing package with discount");
        stiPackage.setPackagePrice(BigDecimal.valueOf(700000)); // 100k discount from 800k
        stiPackage.setIsActive(true);
        stiPackage.setServices(packageServices);
        stiPackage.setCreatedAt(LocalDateTime.now().minusDays(2));
        stiPackage.setUpdatedAt(LocalDateTime.now().minusDays(1));

        // Initialize Request
        validRequest = new STIPackageRequest();
        validRequest.setPackageName("New STI Package");
        validRequest.setDescription("New comprehensive STI package");
        validRequest.setPackagePrice(BigDecimal.valueOf(650000));
        validRequest.setIsActive(true);
        validRequest.setServiceIds(Arrays.asList(1L, 2L));
    }

    // ========== CREATE PACKAGE TESTS ==========

    @Test
    @DisplayName("Tạo package mới - Thành công (Admin)")
    void createPackage_Success_Admin() {
        // Arrange
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.existsByPackageNameIgnoreCase(validRequest.getPackageName())).thenReturn(false);
        when(stiServiceRepository.findAllById(validRequest.getServiceIds()))
                .thenReturn(Arrays.asList(service1, service2));
        when(stiPackageRepository.save(any(STIPackage.class))).thenReturn(stiPackage);
        when(stiPackageRepository.findByIdWithServicesAndComponents(anyLong())).thenReturn(Optional.of(stiPackage));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(validRequest, adminUser.getId()); // Assert
        assertTrue(response.isSuccess(), "Failure reason: " + response.getMessage());
        assertNotNull(response.getData(), "Response data is null");
        assertEquals("STI package created successfully", response.getMessage());

        STIPackageResponse packageResponse = response.getData();
        assertEquals(stiPackage.getPackageId(), packageResponse.getPackageId());
        assertEquals(stiPackage.getPackageName(), packageResponse.getPackageName());
        assertEquals(2, packageResponse.getServiceCount());

        verify(stiPackageRepository).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Tạo package mới - Thành công (Staff)")
    void createPackage_Success_Staff() {
        // Arrange
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(stiPackageRepository.existsByPackageNameIgnoreCase(validRequest.getPackageName())).thenReturn(false);
        when(stiServiceRepository.findAllById(validRequest.getServiceIds()))
                .thenReturn(Arrays.asList(service1, service2));
        when(stiPackageRepository.save(any(STIPackage.class))).thenReturn(stiPackage);
        when(stiPackageRepository.findByIdWithServicesAndComponents(anyLong())).thenReturn(Optional.of(stiPackage));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(validRequest, staffUser.getId()); // Assert
        assertTrue(response.isSuccess(), "Failure reason: " + response.getMessage());
        assertNotNull(response.getData(), "Response data is null");
        verify(stiPackageRepository).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Tạo package mới - Thất bại (User thường)")
    void createPackage_Fail_RegularUser() {
        // Arrange
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(validRequest, regularUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Access denied. Admin or Staff role required", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Tạo package mới - Thất bại (Tên đã tồn tại)")
    void createPackage_Fail_NameExists() {
        // Arrange
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.existsByPackageNameIgnoreCase(validRequest.getPackageName())).thenReturn(true);

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(validRequest, adminUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Package name already exists", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Tạo package mới - Thất bại (Service không tồn tại)")
    void createPackage_Fail_ServiceNotFound() {
        // Arrange
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.existsByPackageNameIgnoreCase(validRequest.getPackageName())).thenReturn(false);
        when(stiServiceRepository.findAllById(validRequest.getServiceIds())).thenReturn(Arrays.asList(service1)); // Only
                                                                                                                  // 1
                                                                                                                  // service
                                                                                                                  // instead
                                                                                                                  // of
                                                                                                                  // 2

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(validRequest, adminUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Some services not found or inactive", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Tạo package mới - Thất bại (Service không hoạt động)")
    void createPackage_Fail_ServiceInactive() {
        // Arrange
        service2.setIsActive(false); // Make service2 inactive

        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.existsByPackageNameIgnoreCase(validRequest.getPackageName())).thenReturn(false);
        when(stiServiceRepository.findAllById(validRequest.getServiceIds()))
                .thenReturn(Arrays.asList(service1, service2));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(validRequest, adminUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("All services must be active", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    // ========== UPDATE PACKAGE TESTS ==========

    @Test
    @DisplayName("Cập nhật package - Thành công")
    void updatePackage_Success() {
        // Arrange
        Long packageId = 1L;
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.findByIdWithServices(packageId)).thenReturn(Optional.of(stiPackage));
        when(stiPackageRepository.findByPackageNameIgnoreCase(validRequest.getPackageName()))
                .thenReturn(Optional.empty());
        when(stiServiceRepository.findAllById(validRequest.getServiceIds()))
                .thenReturn(Arrays.asList(service1, service2));
        when(stiPackageRepository.save(any(STIPackage.class))).thenReturn(stiPackage);
        when(stiPackageRepository.findByIdWithServicesAndComponents(packageId)).thenReturn(Optional.of(stiPackage));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.updatePackage(packageId, validRequest,
                adminUser.getId()); // Assert
        assertTrue(response.isSuccess(), "Failure reason: " + response.getMessage());
        assertNotNull(response.getData(), "Response data is null");
        assertEquals("STI package updated successfully", response.getMessage());
        verify(stiPackageRepository).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Cập nhật package - Thất bại (Package không tồn tại)")
    void updatePackage_Fail_PackageNotFound() {
        // Arrange
        Long packageId = 999L;
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.findByIdWithServices(packageId)).thenReturn(Optional.empty());

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.updatePackage(packageId, validRequest,
                adminUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Package not found", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    // ========== GET PACKAGES TESTS ==========

    @Test
    @DisplayName("Lấy danh sách packages đang hoạt động - Thành công")
    void getActivePackages_Success() {
        // Arrange
        List<STIPackage> activePackages = Arrays.asList(stiPackage);
        when(stiPackageRepository.findActivePackagesWithServices()).thenReturn(activePackages);

        // Act
        ApiResponse<List<STIPackageResponse>> response = stiPackageService.getActivePackages();

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals("Active STI packages retrieved successfully", response.getMessage());
    }

    @Test
    @DisplayName("Lấy chi tiết package theo ID - Thành công")
    void getPackageById_Success() {
        // Arrange
        Long packageId = 1L;
        when(stiPackageRepository.findByIdWithServicesAndComponents(packageId)).thenReturn(Optional.of(stiPackage));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.getPackageById(packageId);

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(packageId, response.getData().getPackageId());
        assertEquals("STI package retrieved successfully", response.getMessage());
    }

    @Test
    @DisplayName("Lấy chi tiết package theo ID - Thất bại (Không tồn tại)")
    void getPackageById_Fail_NotFound() {
        // Arrange
        Long packageId = 999L;
        when(stiPackageRepository.findByIdWithServicesAndComponents(packageId)).thenReturn(Optional.empty());

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.getPackageById(packageId);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Package not found", response.getMessage());
    }

    // ========== SEARCH PACKAGES TESTS ==========

    @Test
    @DisplayName("Tìm kiếm packages theo từ khóa - Thành công")
    void searchPackages_Success() {
        // Arrange
        String keyword = "combo";
        List<STIPackage> searchResults = Arrays.asList(stiPackage);
        when(stiPackageRepository.findByKeyword(keyword)).thenReturn(searchResults);

        // Act
        ApiResponse<List<STIPackageResponse>> response = stiPackageService.searchPackages(keyword);

        // Assert
        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals("Search completed successfully", response.getMessage());
    }

    // ========== DELETE PACKAGE TESTS ==========

    @Test
    @DisplayName("Xóa package - Thành công (Admin)")
    void deletePackage_Success_Admin() {
        // Arrange
        Long packageId = 1L;
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.findById(packageId)).thenReturn(Optional.of(stiPackage));
        when(stiPackageRepository.save(any(STIPackage.class))).thenReturn(stiPackage);

        // Act
        ApiResponse<String> response = stiPackageService.deletePackage(packageId, adminUser.getId());

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("STI package deactivated successfully", response.getMessage());
        verify(stiPackageRepository).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Xóa package - Thất bại (Không phải Admin)")
    void deletePackage_Fail_NotAdmin() {
        // Arrange
        Long packageId = 1L;
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));

        // Act
        ApiResponse<String> response = stiPackageService.deletePackage(packageId, staffUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Access denied. Admin role required", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    @Test
    @DisplayName("Xóa package - Thất bại (Package không tồn tại)")
    void deletePackage_Fail_PackageNotFound() {
        // Arrange
        Long packageId = 999L;
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiPackageRepository.findById(packageId)).thenReturn(Optional.empty());

        // Act
        ApiResponse<String> response = stiPackageService.deletePackage(packageId, adminUser.getId());

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Package not found", response.getMessage());
        verify(stiPackageRepository, never()).save(any(STIPackage.class));
    }

    // ========== CALCULATION TESTS ==========

    @Test
    @DisplayName("Kiểm tra tính toán giá và discount trong response")
    void packageResponse_PriceCalculations() {
        // Arrange
        when(stiPackageRepository.findByIdWithServicesAndComponents(1L)).thenReturn(Optional.of(stiPackage));

        // Act
        ApiResponse<STIPackageResponse> response = stiPackageService.getPackageById(1L);

        // Assert
        assertTrue(response.isSuccess());
        STIPackageResponse packageResponse = response.getData(); // Verify calculations
        assertEquals(3, packageResponse.getTotalComponentCount()); // 2 + 1 components
        assertEquals(0, BigDecimal.valueOf(800000).compareTo(packageResponse.getTotalIndividualPrice())); // 500k + 300k
        assertEquals(0, BigDecimal.valueOf(100000).compareTo(packageResponse.getSavingsAmount())); // 800k - 700k
        assertEquals(12.5, packageResponse.getDiscountPercentage(), 0.01); // 100k/800k * 100
    }
}
