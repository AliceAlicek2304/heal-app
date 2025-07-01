package com.healapp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ComponentUpdateRequest;
import com.healapp.dto.STIServiceRequest;
import com.healapp.dto.STIServiceResponse;
import com.healapp.model.STIService;
import com.healapp.model.ServiceTestComponent;
import com.healapp.model.UserDtls;
import com.healapp.repository.STIServiceRepository;
import com.healapp.repository.ServiceTestComponentRepository;
import com.healapp.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class STIServiceService {

    @Autowired
    private STIServiceRepository stiServiceRepository;

    @Autowired
    private ServiceTestComponentRepository serviceTestComponentRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Tạo dịch vụ xét nghiệm mới với các components (ADMIN and STAFF only)
     */
    @Transactional
    public ApiResponse<STIServiceResponse> createServiceWithComponents(STIServiceRequest request, Long userId) {
        try {
            log.info("Creating STI service: {} by user: {}", request.getName(), userId);

            // Kiểm tra user có quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.error("User not found: {}", userId);
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            // Cập nhật: Kiểm tra role thông qua Role entity
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
            log.info("User found: {} with role: {}", user.getUsername(), roleName);

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                log.error("User {} does not have permission, role: {}", user.getUsername(), roleName);
                return ApiResponse.error("Only ADMIN and STAFF can create STI services");
            }

            // Kiểm tra tên dịch vụ đã tồn tại
            if (stiServiceRepository.existsByNameIgnoreCase(request.getName())) {
                log.error("Service name already exists: {}", request.getName());
                return ApiResponse.error("Service name already exists");
            }

            // Tạo dịch vụ mới
            STIService stiService = new STIService();
            stiService.setName(request.getName());
            stiService.setDescription(request.getDescription());
            stiService.setPrice(request.getPrice());
            stiService.setIsActive(true);

            log.info("Saving STI service: {}", stiService.getName());
            STIService savedService = stiServiceRepository.save(stiService);
            log.info("STI service saved with ID: {}", savedService.getServiceId());

            // Tạo các test components cho dịch vụ
            if (request.getTestComponents() != null && !request.getTestComponents().isEmpty()) {
                log.info("Creating {} test components", request.getTestComponents().size());

                for (STIServiceRequest.TestComponentRequest componentReq : request.getTestComponents()) {
                    try {
                        ServiceTestComponent component = new ServiceTestComponent();
                        component.setStiService(savedService);
                        component.setTestName(componentReq.getTestName());
                        component.setReferenceRange(componentReq.getReferenceRange());

                        ServiceTestComponent savedComponent = serviceTestComponentRepository.save(component);
                        log.info("Component saved: {} with ID: {}", savedComponent.getTestName(),
                                savedComponent.getComponentId());

                    } catch (Exception e) {
                        log.error("Error saving component: {}", componentReq.getTestName(), e);
                        throw e; // Re-throw để trigger rollback
                    }
                }
            }

            // Lấy lại service với components để response
            STIService serviceWithComponents = stiServiceRepository.findByIdWithComponents(savedService.getServiceId())
                    .orElse(savedService);

            STIServiceResponse response = convertToResponseWithComponents(serviceWithComponents);
            log.info("STI Service with components created successfully by user: {} - Service ID: {}",
                    user.getUsername(), savedService.getServiceId());

            return ApiResponse.success("STI service with components created successfully", response);

        } catch (Exception e) {
            log.error("Error creating STI service with components: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create STI service: " + e.getMessage(), e);
        }
    }

    /**
     * Cập nhật dịch vụ và components (ADMIN and STAFF only)
     */
    @Transactional
    public ApiResponse<STIServiceResponse> updateServiceWithComponents(Long serviceId, STIServiceRequest request,
            Long userId) {
        try {
            // Kiểm tra user có quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            // Cập nhật: Kiểm tra role thông qua Role entity
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                return ApiResponse.error("Only ADMIN and STAFF can update STI services");
            }

            // Tìm dịch vụ cần cập nhật
            Optional<STIService> serviceOpt = stiServiceRepository.findById(serviceId);
            if (serviceOpt.isEmpty()) {
                return ApiResponse.error("STI service not found");
            }

            STIService stiService = serviceOpt.get();

            // Kiểm tra tên dịch vụ trùng
            Optional<STIService> existingService = stiServiceRepository.findByNameIgnoreCase(request.getName());
            if (existingService.isPresent() && !existingService.get().getServiceId().equals(serviceId)) {
                return ApiResponse.error("Service name already exists");
            }

            // Cập nhật thông tin dịch vụ
            stiService.setName(request.getName());
            stiService.setDescription(request.getDescription());
            stiService.setPrice(request.getPrice());
            stiService.setIsActive(request.getIsActive());

            STIService updatedService = stiServiceRepository.save(stiService);            // Cập nhật components (soft delete và update logic)
            if (request.getTestComponents() != null) {
                updateServiceComponents(updatedService, request.getTestComponents());
            }

            // Lấy lại service với components
            STIService serviceWithComponents = stiServiceRepository.findByIdWithComponents(serviceId)
                    .orElse(updatedService);

            STIServiceResponse response = convertToResponse(serviceWithComponents);
            log.info("STI Service updated successfully by user: {} - Service ID: {}",
                    user.getUsername(), serviceId);

            return ApiResponse.success("STI service updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating STI service: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update STI service: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách dịch vụ đang hoạt động (cho user)
     */
    public ApiResponse<List<STIServiceResponse>> getActiveServices() {
        try {
            List<STIService> activeServices = stiServiceRepository.findByIsActiveTrue();
            List<STIServiceResponse> responses = activeServices.stream()
                    .map(this::convertToResponse)
                    .toList();

            return ApiResponse.success("Active STI services retrieved successfully", responses);

        } catch (Exception e) {
            log.error("Error retrieving active STI services: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve active STI services: " + e.getMessage());
        }
    }

    /**
     * Lấy chi tiết dịch vụ kèm components
     */
    public ApiResponse<STIServiceResponse> getServiceWithComponents(Long serviceId) {
        try {
            Optional<STIService> serviceOpt = stiServiceRepository.findByIdWithComponents(serviceId);
            if (serviceOpt.isEmpty()) {
                return ApiResponse.error("STI service not found");
            }

            STIService stiService = serviceOpt.get();
            STIServiceResponse response = convertToResponseWithComponents(stiService);

            return ApiResponse.success("STI service with components retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving STI service with components: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI service: " + e.getMessage());
        }
    }

    /**
     * Toggle trạng thái hoạt động của dịch vụ (Soft Delete/Restore)
     */
    @Transactional
    public ApiResponse<STIServiceResponse> toggleServiceStatus(Long serviceId, Long userId) {
        try {
            log.info("Toggling STI service status: {} by user: {}", serviceId, userId);

            // Kiểm tra user có quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.error("User not found: {}", userId);
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                log.error("User {} does not have permission, role: {}", user.getUsername(), roleName);
                return ApiResponse.error("Only ADMIN and STAFF can toggle STI service status");
            }

            // Tìm dịch vụ cần toggle status
            Optional<STIService> serviceOpt = stiServiceRepository.findById(serviceId);
            if (serviceOpt.isEmpty()) {
                log.error("STI service not found: {}", serviceId);
                return ApiResponse.error("STI service not found");
            }

            STIService stiService = serviceOpt.get();
            boolean newStatus = !stiService.getIsActive();
            stiService.setIsActive(newStatus);

            STIService updatedService = stiServiceRepository.save(stiService);
            STIServiceResponse response = convertToResponse(updatedService);

            String action = newStatus ? "activated" : "deactivated";
            log.info("STI Service {} successfully by user: {} - Service ID: {}",
                    action, user.getUsername(), serviceId);

            return ApiResponse.success(
                    String.format("STI service %s successfully", action), response);

        } catch (Exception e) {
            log.error("Error toggling STI service status: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to toggle STI service status: " + e.getMessage());
        }
    }

    /**
     * Lấy tất cả dịch vụ (bao gồm cả inactive) - chỉ dành cho STAFF/ADMIN
     */
    public ApiResponse<List<STIServiceResponse>> getAllServicesForManagement(Long userId) {
        try {
            // Kiểm tra user có quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                return ApiResponse.error("Only ADMIN and STAFF can view all services");
            }

            List<STIService> allServices = stiServiceRepository.findAllByOrderByCreatedAtDesc();
            List<STIServiceResponse> responses = allServices.stream()
                    .map(this::convertToResponse)
                    .toList();

            return ApiResponse.success("All STI services retrieved successfully", responses);

        } catch (Exception e) {
            log.error("Error retrieving all STI services: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve all STI services: " + e.getMessage());
        }
    }

    /**
     * Search STI services by keyword
     */
    public ApiResponse<List<STIServiceResponse>> searchActiveServices(String keyword) {
        try {
            log.info("Searching STI services with keyword: {}", keyword);

            if (keyword == null || keyword.trim().isEmpty()) {
                return ApiResponse.error("Search keyword cannot be empty");
            }

            List<STIService> services = stiServiceRepository.searchActiveServices(keyword.trim());
            List<STIServiceResponse> serviceResponses = services.stream()
                    .map(this::convertToResponse)
                    .toList();

            return ApiResponse.success("STI services searched successfully", serviceResponses);
        } catch (Exception e) {
            log.error("Error searching STI services: {}", e.getMessage());
            return ApiResponse.error("Failed to search STI services: " + e.getMessage());
        }
    }

    /**
     * Convert STIService to Response
     */
    private STIServiceResponse convertToResponse(STIService stiService) {
        STIServiceResponse response = new STIServiceResponse();
        response.setServiceId(stiService.getServiceId());
        response.setName(stiService.getName());
        response.setDescription(stiService.getDescription());
        response.setPrice(stiService.getPrice());
        response.setIsActive(stiService.getIsActive());
        response.setCreatedAt(stiService.getCreatedAt());
        response.setUpdatedAt(stiService.getUpdatedAt());        // Đếm số components active
        if (stiService.getTestComponents() != null) {
            long activeComponentCount = stiService.getTestComponents().stream()
                    .filter(component -> component.getStatus())
                    .count();
            response.setComponentCount((int) activeComponentCount);
        } else {
            response.setComponentCount(0);
        }

        return response;
    }

    /**
     * Convert STIService to Response with Components
     */
    private STIServiceResponse convertToResponseWithComponents(STIService stiService) {
        STIServiceResponse response = convertToResponse(stiService);
        
        // Thêm thông tin components (chỉ hiển thị active components)
        if (stiService.getTestComponents() != null) {
            List<STIServiceResponse.TestComponentResponse> componentResponses = stiService.getTestComponents().stream()
                    .filter(component -> component.getStatus()) // Chỉ lấy components active
                    .map(component -> {
                        STIServiceResponse.TestComponentResponse compResp = new STIServiceResponse.TestComponentResponse();
                        compResp.setComponentId(component.getComponentId());
                        compResp.setTestName(component.getTestName());
                        compResp.setReferenceRange(component.getReferenceRange());
                        compResp.setUnit(component.getUnit()); // Thêm unit
                        compResp.setStatus(component.getStatus()); // Thêm status
                        return compResp;
                    })
                    .toList();

            response.setTestComponents(componentResponses);
        }

        return response;
    }

    /**
     * Get all services for admin (including inactive ones)
     */
    public ApiResponse<List<STIServiceResponse>> getAllServices() {
        try {
            log.info("Getting all STI services for admin");

            List<STIService> services = stiServiceRepository.findAllByOrderByCreatedAtDesc();

            List<STIServiceResponse> serviceResponses = services.stream()
                    .map(this::convertToResponseWithComponents)
                    .toList();
            log.info("Found {} STI services", serviceResponses.size());
            return ApiResponse.success("Services retrieved successfully", serviceResponses);

        } catch (Exception e) {
            log.error("Error getting all STI services: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI services");
        }
    }

    /**
     * Cập nhật components của service với logic soft delete
     */
    private void updateServiceComponents(STIService service, List<STIServiceRequest.TestComponentRequest> requestComponents) {
        // Lấy tất cả components hiện tại của service (bao gồm cả inactive)
        List<ServiceTestComponent> existingComponents = serviceTestComponentRepository
                .findByStiServiceServiceId(service.getServiceId());

        // Đánh dấu tất cả components hiện tại là inactive trước
        for (ServiceTestComponent existing : existingComponents) {
            existing.setStatus(false);
            serviceTestComponentRepository.save(existing);
        }        // Xử lý từng component trong request
        for (STIServiceRequest.TestComponentRequest componentReq : requestComponents) {
            // Tìm xem có component trùng tên không
            Optional<ServiceTestComponent> existingOpt = existingComponents.stream()
                    .filter(comp -> comp.getTestName().equalsIgnoreCase(componentReq.getTestName()))
                    .findFirst();

            if (existingOpt.isPresent()) {
                // Cập nhật component hiện tại
                ServiceTestComponent existing = existingOpt.get();
                existing.setStatus(componentReq.getStatus() != null ? componentReq.getStatus() : Boolean.TRUE);
                existing.setReferenceRange(componentReq.getReferenceRange());
                serviceTestComponentRepository.save(existing);
                log.info("Updated component: {} with status: {} for service: {}",
                        existing.getTestName(), existing.getStatus(), service.getName());
            } else {
                // Tạo component mới
                ServiceTestComponent newComponent = new ServiceTestComponent();
                newComponent.setStiService(service);
                newComponent.setTestName(componentReq.getTestName());
                newComponent.setReferenceRange(componentReq.getReferenceRange());
                newComponent.setStatus(componentReq.getStatus() != null ? componentReq.getStatus() : Boolean.TRUE);
                serviceTestComponentRepository.save(newComponent);
                log.info("Created new component: {} with status: {} for service: {}",
                        newComponent.getTestName(), newComponent.getStatus(), service.getName());
            }
        }
    }

    /**
     * Lấy chi tiết dịch vụ kèm tất cả components (bao gồm inactive) cho form
     * update
     */
    public ApiResponse<STIServiceResponse> getServiceWithAllComponents(Long serviceId, Long userId) {
        try {
            // Kiểm tra user có quyền
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                return ApiResponse.error("Only ADMIN and STAFF can view all components");
            }

            Optional<STIService> serviceOpt = stiServiceRepository.findById(serviceId);
            if (serviceOpt.isEmpty()) {
                return ApiResponse.error("STI service not found");
            }

            STIService stiService = serviceOpt.get();
            // Lấy tất cả components (bao gồm inactive) để hiển thị trong form update
            List<ServiceTestComponent> allComponents = serviceTestComponentRepository
                    .findByStiServiceServiceIdOrderByStatusDescCreatedAtDesc(serviceId);

            stiService.setTestComponents(allComponents);
            STIServiceResponse response = convertToResponseWithAllComponents(stiService);

            return ApiResponse.success("STI service with all components retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving STI service with all components: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to retrieve STI service: " + e.getMessage());
        }
    }

    /**
     * Convert STIService to Response with All Components (including inactive)
     */
    private STIServiceResponse convertToResponseWithAllComponents(STIService stiService) {
        STIServiceResponse response = convertToResponse(stiService);

        // Thêm thông tin tất cả components (bao gồm inactive)
        if (stiService.getTestComponents() != null) {
            List<STIServiceResponse.TestComponentResponse> componentResponses = stiService.getTestComponents().stream()
                    .map(component -> {
                        STIServiceResponse.TestComponentResponse compResp = new STIServiceResponse.TestComponentResponse();
                        compResp.setComponentId(component.getComponentId());
                        compResp.setTestName(component.getTestName());
                        compResp.setReferenceRange(component.getReferenceRange());
                        compResp.setUnit(component.getUnit());
                        compResp.setStatus(component.getStatus());
                        return compResp;
                    })
                    .toList();

            response.setTestComponents(componentResponses);
        }

        return response;
    }

    // ========= INDIVIDUAL COMPONENT MANAGEMENT =========

    /**
     * Update individual component
     */
    @Transactional
    public ApiResponse<STIServiceResponse.TestComponentResponse> updateComponent(Long componentId, 
            ComponentUpdateRequest request, Long userId) {
        try {
            log.info("Updating component {} by user {}", componentId, userId);

            // Kiểm tra quyền user
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                return ApiResponse.error("Only ADMIN and STAFF can update components");
            }

            // Tìm component
            Optional<ServiceTestComponent> componentOpt = serviceTestComponentRepository.findById(componentId);
            if (componentOpt.isEmpty()) {
                return ApiResponse.error("Component not found");
            }

            ServiceTestComponent component = componentOpt.get();

            // Kiểm tra xem có component khác cùng tên trong cùng service không
            Optional<ServiceTestComponent> duplicateOpt = serviceTestComponentRepository
                    .findByStiServiceAndTestNameIgnoreCase(component.getStiService(), request.getTestName());
            
            if (duplicateOpt.isPresent() && !duplicateOpt.get().getComponentId().equals(componentId)) {
                return ApiResponse.error("Component with this name already exists in this service");
            }

            // Cập nhật component
            component.setTestName(request.getTestName());
            component.setReferenceRange(request.getReferenceRange());
            component.setUnit(request.getUnit());
            component.setStatus(request.getStatus());

            ServiceTestComponent savedComponent = serviceTestComponentRepository.save(component);

            // Convert to response
            STIServiceResponse.TestComponentResponse response = new STIServiceResponse.TestComponentResponse();
            response.setComponentId(savedComponent.getComponentId());
            response.setTestName(savedComponent.getTestName());
            response.setReferenceRange(savedComponent.getReferenceRange());
            response.setUnit(savedComponent.getUnit());
            response.setStatus(savedComponent.getStatus());

            log.info("Component {} updated successfully", componentId);
            return ApiResponse.success("Component updated successfully", response);

        } catch (Exception e) {
            log.error("Error updating component {}: {}", componentId, e.getMessage(), e);
            return ApiResponse.error("Failed to update component: " + e.getMessage());
        }
    }

    /**
     * Toggle component status
     */
    @Transactional
    public ApiResponse<STIServiceResponse.TestComponentResponse> toggleComponentStatus(Long componentId, Long userId) {
        try {
            log.info("Toggling component {} status by user {}", componentId, userId);

            // Kiểm tra quyền user
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                return ApiResponse.error("Only ADMIN and STAFF can toggle component status");
            }

            // Tìm component
            Optional<ServiceTestComponent> componentOpt = serviceTestComponentRepository.findById(componentId);
            if (componentOpt.isEmpty()) {
                return ApiResponse.error("Component not found");
            }

            ServiceTestComponent component = componentOpt.get();

            // Toggle status
            component.setStatus(!component.getStatus());
            ServiceTestComponent savedComponent = serviceTestComponentRepository.save(component);

            // Convert to response
            STIServiceResponse.TestComponentResponse response = new STIServiceResponse.TestComponentResponse();
            response.setComponentId(savedComponent.getComponentId());
            response.setTestName(savedComponent.getTestName());
            response.setReferenceRange(savedComponent.getReferenceRange());
            response.setUnit(savedComponent.getUnit());
            response.setStatus(savedComponent.getStatus());

            log.info("Component {} status toggled to {}", componentId, savedComponent.getStatus());
            return ApiResponse.success("Component status updated successfully", response);

        } catch (Exception e) {
            log.error("Error toggling component {} status: {}", componentId, e.getMessage(), e);
            return ApiResponse.error("Failed to toggle component status: " + e.getMessage());
        }
    }

    /**
     * Delete component (soft delete)
     */
    @Transactional
    public ApiResponse<String> deleteComponent(Long componentId, Long userId) {
        try {
            log.info("Deleting component {} by user {}", componentId, userId);

            // Kiểm tra quyền user
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;

            if (!"ADMIN".equals(roleName) && !"STAFF".equals(roleName)) {
                return ApiResponse.error("Only ADMIN and STAFF can delete components");
            }

            // Tìm component
            Optional<ServiceTestComponent> componentOpt = serviceTestComponentRepository.findById(componentId);
            if (componentOpt.isEmpty()) {
                return ApiResponse.error("Component not found");
            }

            ServiceTestComponent component = componentOpt.get();

            // Soft delete
            component.setStatus(false);
            serviceTestComponentRepository.save(component);

            log.info("Component {} deleted successfully", componentId);
            return ApiResponse.success("Component deleted successfully", "Component has been deactivated");

        } catch (Exception e) {
            log.error("Error deleting component {}: {}", componentId, e.getMessage(), e);
            return ApiResponse.error("Failed to delete component: " + e.getMessage());
        }
    }
}
