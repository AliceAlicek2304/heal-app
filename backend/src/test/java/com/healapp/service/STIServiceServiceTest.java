package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STIServiceRequest;
import com.healapp.dto.STIServiceResponse;
import com.healapp.model.Role;
import com.healapp.model.STIService;
import com.healapp.model.ServiceTestComponent;
import com.healapp.model.UserDtls;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.ServiceTestComponentRepository;
import com.healapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử dịch vụ quản lý STI Service")
public class STIServiceServiceTest {

    @Mock
    private STIServiceRepository stiServiceRepository;

    @Mock
    private ServiceTestComponentRepository serviceTestComponentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private STIServiceService stiServiceService;
    private UserDtls adminUser;
    private UserDtls staffUser;
    private UserDtls regularUser;
    private STIService stiService;
    private STIServiceRequest validRequest;
    private List<ServiceTestComponent> testComponents;

    // Cập nhật: Thêm Role entities
    private Role adminRole;
    private Role staffRole;
    private Role userRole;

    @BeforeEach
    void setUp() {
        // Cập nhật: Khởi tạo Role entities
        adminRole = new Role();
        adminRole.setRoleId(1L);
        adminRole.setRoleName("ADMIN");
        adminRole.setDescription("Administrator role");

        staffRole = new Role();
        staffRole.setRoleId(2L);
        staffRole.setRoleName("STAFF");
        staffRole.setDescription("Staff role");

        userRole = new Role();
        userRole.setRoleId(3L);
        userRole.setRoleName("USER");
        userRole.setDescription("Regular user role");

        // Cập nhật: Khởi tạo user admin với Role entity
        adminUser = new UserDtls();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setFullName("Admin User");
        adminUser.setRole(adminRole);

        // Cập nhật: Khởi tạo user staff với Role entity
        staffUser = new UserDtls();
        staffUser.setId(2L);
        staffUser.setUsername("staff");
        staffUser.setFullName("Staff User");
        staffUser.setRole(staffRole);

        // Cập nhật: Khởi tạo user thường với Role entity
        regularUser = new UserDtls();
        regularUser.setId(3L);
        regularUser.setUsername("user");
        regularUser.setFullName("Regular User");
        regularUser.setRole(userRole); // Khởi tạo các thành phần xét nghiệm
        testComponents = new ArrayList<>();
        ServiceTestComponent component1 = new ServiceTestComponent();
        component1.setComponentId(1L);
        component1.setTestName("Xét nghiệm HIV");
        component1.setReferenceRange("Âm tính");

        ServiceTestComponent component2 = new ServiceTestComponent();
        component2.setComponentId(2L);
        component2.setTestName("Xét nghiệm viêm gan B");
        component2.setReferenceRange("Âm tính");

        testComponents.add(component1);
        testComponents.add(component2);

        // Khởi tạo dịch vụ STI
        stiService = new STIService();
        stiService.setServiceId(1L);
        stiService.setName("Gói xét nghiệm STI toàn diện");
        stiService.setDescription("Gói kiểm tra các bệnh lây qua đường tình dục");
        stiService.setPrice(500000.0);
        stiService.setIsActive(true);
        stiService.setCreatedAt(LocalDateTime.now().minusDays(5));
        stiService.setUpdatedAt(LocalDateTime.now());
        stiService.setTestComponents(testComponents);

        // Khởi tạo request hợp lệ
        validRequest = new STIServiceRequest();
        validRequest.setName("Gói xét nghiệm STI toàn diện");
        validRequest.setDescription("Gói kiểm tra các bệnh lây qua đường tình dục");
        validRequest.setPrice(500000.0);
        validRequest.setIsActive(true);
        List<STIServiceRequest.TestComponentRequest> componentRequests = new ArrayList<>();
        STIServiceRequest.TestComponentRequest compReq1 = new STIServiceRequest.TestComponentRequest();
        compReq1.setTestName("Xét nghiệm HIV");
        compReq1.setReferenceRange("Âm tính");

        STIServiceRequest.TestComponentRequest compReq2 = new STIServiceRequest.TestComponentRequest();
        compReq2.setTestName("Xét nghiệm viêm gan B");
        compReq2.setReferenceRange("Âm tính");

        componentRequests.add(compReq1);
        componentRequests.add(compReq2);
        validRequest.setTestComponents(componentRequests);
    }

    @Test
    @DisplayName("Tạo dịch vụ STI với các thành phần xét nghiệm - Thành công (Admin)")
    void createServiceWithComponents_Success_Admin() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        when(stiServiceRepository.save(any(STIService.class))).thenReturn(stiService);
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.of(stiService));
        when(serviceTestComponentRepository.save(any(ServiceTestComponent.class))).thenReturn(testComponents.get(0));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest,
                adminUser.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI service with components created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiService.getName(), response.getData().getName());
        assertEquals(2, response.getData().getComponentCount());
        verify(stiServiceRepository, times(1)).save(any(STIService.class));
        verify(serviceTestComponentRepository, times(2)).save(any(ServiceTestComponent.class));
    }

    @Test
    @DisplayName("Tạo dịch vụ STI với các thành phần xét nghiệm - Thành công (Staff)")
    void createServiceWithComponents_Success_Staff() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(stiServiceRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        when(stiServiceRepository.save(any(STIService.class))).thenReturn(stiService);
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.of(stiService));
        when(serviceTestComponentRepository.save(any(ServiceTestComponent.class))).thenReturn(testComponents.get(0));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest,
                staffUser.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI service with components created successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiService.getName(), response.getData().getName());
        assertEquals(2, response.getData().getComponentCount());
        verify(stiServiceRepository, times(1)).save(any(STIService.class));
        verify(serviceTestComponentRepository, times(2)).save(any(ServiceTestComponent.class));
    }

    @Test
    @DisplayName("Tạo dịch vụ STI - Thất bại do người dùng không có quyền")
    void createServiceWithComponents_NotAuthorized() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest,
                regularUser.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN and STAFF can create STI services", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }

    @Test
    @DisplayName("Tạo dịch vụ STI - Thất bại do tên dịch vụ đã tồn tại")
    void createServiceWithComponents_DuplicateName() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.existsByNameIgnoreCase(anyString())).thenReturn(true);

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest,
                adminUser.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Service name already exists", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI với các thành phần - Thành công (Admin)")
    void updateServiceWithComponents_Success_Admin() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.findById(anyLong())).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.save(any(STIService.class))).thenReturn(stiService);
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.of(stiService));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                stiService.getServiceId(), validRequest, adminUser.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI service updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiService.getName(), response.getData().getName());
        verify(stiServiceRepository, times(1)).save(any(STIService.class));
        verify(serviceTestComponentRepository, times(1)).deleteByStiServiceServiceId(anyLong());
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI với các thành phần - Thành công (Staff)")
    void updateServiceWithComponents_Success_Staff() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(staffUser.getId())).thenReturn(Optional.of(staffUser));
        when(stiServiceRepository.findById(anyLong())).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.save(any(STIService.class))).thenReturn(stiService);
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.of(stiService));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                stiService.getServiceId(), validRequest, staffUser.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI service updated successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiService.getName(), response.getData().getName());
        verify(stiServiceRepository, times(1)).save(any(STIService.class));
        verify(serviceTestComponentRepository, times(1)).deleteByStiServiceServiceId(anyLong());
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI - Thất bại do không tìm thấy dịch vụ")
    void updateServiceWithComponents_ServiceNotFound() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                999L, validRequest, adminUser.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("STI service not found", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }

    @Test
    @DisplayName("Lấy danh sách dịch vụ STI đang hoạt động - Thành công")
    void getActiveServices_Success() {
        // Chuẩn bị dữ liệu
        List<STIService> activeServices = new ArrayList<>();
        activeServices.add(stiService);
        when(stiServiceRepository.findByIsActiveTrue()).thenReturn(activeServices);

        // Thực hiện hành động
        ApiResponse<List<STIServiceResponse>> response = stiServiceService.getActiveServices();

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("Active STI services retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals(stiService.getName(), response.getData().get(0).getName());
    }

    @Test
    @DisplayName("Lấy chi tiết dịch vụ STI với các thành phần xét nghiệm - Thành công")
    void getServiceWithComponents_Success() {
        // Chuẩn bị dữ liệu
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.of(stiService));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService
                .getServiceWithComponents(stiService.getServiceId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI service with components retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(stiService.getName(), response.getData().getName());
        assertNotNull(response.getData().getTestComponents());
        assertEquals(2, response.getData().getTestComponents().size());
    }

    @Test
    @DisplayName("Lấy chi tiết dịch vụ STI - Thất bại do không tìm thấy dịch vụ")
    void getServiceWithComponents_NotFound() {
        // Chuẩn bị dữ liệu
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.getServiceWithComponents(999L);

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("STI service not found", response.getMessage());
    }

    @Test
    @DisplayName("Tạo dịch vụ STI không có thành phần xét nghiệm - Thành công")
    void createServiceWithComponents_NullComponents() {
        // Chuẩn bị dữ liệu
        validRequest.setTestComponents(null);
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        when(stiServiceRepository.save(any(STIService.class))).thenReturn(stiService);
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenReturn(Optional.of(stiService));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest,
                adminUser.getId());

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("STI service with components created successfully", response.getMessage());
        verify(serviceTestComponentRepository, never()).save(any(ServiceTestComponent.class));
    }

    @Test
    @DisplayName("Tạo dịch vụ STI - Thất bại do không tìm thấy User")
    void createServiceWithComponents_UserNotFound() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest, 999L);

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI - Thất bại do trùng tên với dịch vụ khác")
    void updateServiceWithComponents_DuplicateNameDifferentService() {
        // Chuẩn bị dữ liệu
        STIService existingService = new STIService();
        existingService.setServiceId(2L);
        existingService.setName("Gói xét nghiệm STI toàn diện");

        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.findById(1L)).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(existingService));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                1L, validRequest, adminUser.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Service name already exists", response.getMessage());
    }

    @Test
    @DisplayName("Lấy danh sách dịch vụ STI đang hoạt động - Danh sách trống")
    void getActiveServices_EmptyList() {
        // Chuẩn bị dữ liệu
        when(stiServiceRepository.findByIsActiveTrue()).thenReturn(new ArrayList<>());

        // Thực hiện hành động
        ApiResponse<List<STIServiceResponse>> response = stiServiceService.getActiveServices();

        // Kiểm tra kết quả
        assertTrue(response.isSuccess());
        assertEquals("Active STI services retrieved successfully", response.getMessage());
        assertNotNull(response.getData());
        assertEquals(0, response.getData().size());
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI - Thất bại do người dùng không có quyền")
    void updateServiceWithComponents_NotAuthorized() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                stiService.getServiceId(), validRequest, regularUser.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN and STAFF can update STI services", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI - Thất bại do không tìm thấy người dùng")
    void updateServiceWithComponents_UserNotFound() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                stiService.getServiceId(), validRequest, 999L);

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("User not found", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }

    @Test
    @DisplayName("Tạo dịch vụ STI - Thất bại do ngoại lệ xảy ra")
    void createServiceWithComponents_Exception() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.existsByNameIgnoreCase(anyString())).thenReturn(false);
        when(stiServiceRepository.save(any(STIService.class))).thenThrow(new RuntimeException("Database error"));

        // Thực hiện hành động và kiểm tra exception
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            stiServiceService.createServiceWithComponents(validRequest, adminUser.getId());
        });

        // Kiểm tra kết quả
        assertTrue(thrown.getMessage().contains("Failed to create STI service"));
        verify(stiServiceRepository, times(1)).save(any(STIService.class));
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI - Thất bại do ngoại lệ xảy ra")
    void updateServiceWithComponents_Exception() {
        // Chuẩn bị dữ liệu
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(stiServiceRepository.findById(anyLong())).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(stiService));
        when(stiServiceRepository.save(any(STIService.class))).thenThrow(new RuntimeException("Database error"));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                stiService.getServiceId(), validRequest, adminUser.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to update STI service"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Lấy danh sách dịch vụ STI đang hoạt động - Thất bại do ngoại lệ xảy ra")
    void getActiveServices_Exception() {
        // Chuẩn bị dữ liệu
        when(stiServiceRepository.findByIsActiveTrue()).thenThrow(new RuntimeException("Database error"));

        // Thực hiện hành động
        ApiResponse<List<STIServiceResponse>> response = stiServiceService.getActiveServices();

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve active STI services"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Lấy chi tiết dịch vụ STI - Thất bại do ngoại lệ xảy ra")
    void getServiceWithComponents_Exception() {
        // Chuẩn bị dữ liệu
        when(stiServiceRepository.findByIdWithComponents(anyLong())).thenThrow(new RuntimeException("Database error"));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService
                .getServiceWithComponents(stiService.getServiceId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertTrue(response.getMessage().contains("Failed to retrieve STI service"));
        assertNull(response.getData());
    }

    @Test
    @DisplayName("Tạo dịch vụ STI - Thất bại do người dùng không có role")
    void createServiceWithComponents_UserWithoutRole() {
        // Chuẩn bị dữ liệu - user không có role
        UserDtls userWithoutRole = new UserDtls();
        userWithoutRole.setId(4L);
        userWithoutRole.setUsername("noRole");
        userWithoutRole.setFullName("User Without Role");
        userWithoutRole.setRole(null);

        when(userRepository.findById(userWithoutRole.getId())).thenReturn(Optional.of(userWithoutRole));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.createServiceWithComponents(validRequest,
                userWithoutRole.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN and STAFF can create STI services", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }

    @Test
    @DisplayName("Cập nhật dịch vụ STI - Thất bại do người dùng không có role")
    void updateServiceWithComponents_UserWithoutRole() {
        // Chuẩn bị dữ liệu - user không có role
        UserDtls userWithoutRole = new UserDtls();
        userWithoutRole.setId(4L);
        userWithoutRole.setUsername("noRole");
        userWithoutRole.setFullName("User Without Role");
        userWithoutRole.setRole(null);

        when(userRepository.findById(userWithoutRole.getId())).thenReturn(Optional.of(userWithoutRole));

        // Thực hiện hành động
        ApiResponse<STIServiceResponse> response = stiServiceService.updateServiceWithComponents(
                stiService.getServiceId(), validRequest, userWithoutRole.getId());

        // Kiểm tra kết quả
        assertFalse(response.isSuccess());
        assertEquals("Only ADMIN and STAFF can update STI services", response.getMessage());
        verify(stiServiceRepository, never()).save(any(STIService.class));
    }
}