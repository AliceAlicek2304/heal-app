package com.healapp.controller;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.STIPackageRequest;
import com.healapp.dto.STIPackageResponse;
import com.healapp.service.STIPackageService;
import com.healapp.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/sti-packages")
@CrossOrigin(origins = "http://localhost:3000")
public class STIPackageController {
    @Autowired
    private STIPackageService stiPackageService;

    @Autowired
    private UserService userService;

    /**
     * Tạo package mới (Admin/Staff only)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<STIPackageResponse>> createPackage(
            @Valid @RequestBody STIPackageRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Authentication required"));
            }

            ApiResponse<STIPackageResponse> response = stiPackageService.createPackage(request, userId);
            return ResponseEntity.status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                    .body(response);

        } catch (Exception e) {
            log.error("Error creating STI package: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create STI package"));
        }
    }

    /**
     * Cập nhật package (Admin/Staff only)
     */
    @PutMapping("/{packageId}")
    public ResponseEntity<ApiResponse<STIPackageResponse>> updatePackage(
            @PathVariable Long packageId,
            @Valid @RequestBody STIPackageRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Authentication required"));
            }

            ApiResponse<STIPackageResponse> response = stiPackageService.updatePackage(packageId, request, userId);
            return ResponseEntity.status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                    .body(response);

        } catch (Exception e) {
            log.error("Error updating STI package: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update STI package"));
        }
    }

    /**
     * Lấy danh sách packages đang hoạt động (Public)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<STIPackageResponse>>> getActivePackages() {
        try {
            ApiResponse<List<STIPackageResponse>> response = stiPackageService.getActivePackages();
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrieving active STI packages: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve STI packages"));
        }
    }

    /**
     * Lấy chi tiết package theo ID (Public)
     */
    @GetMapping("/{packageId}")
    public ResponseEntity<ApiResponse<STIPackageResponse>> getPackageById(@PathVariable Long packageId) {
        try {
            ApiResponse<STIPackageResponse> response = stiPackageService.getPackageById(packageId);
            return ResponseEntity.status(response.isSuccess() ? HttpStatus.OK : HttpStatus.NOT_FOUND)
                    .body(response);

        } catch (Exception e) {
            log.error("Error retrieving STI package: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve STI package"));
        }
    }

    /**
     * Tìm kiếm packages theo từ khóa (Public)
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<STIPackageResponse>>> searchPackages(
            @RequestParam(required = false) String keyword) {
        try {
            if (keyword == null || keyword.trim().isEmpty()) {
                return getActivePackages(); // Return all active packages if no keyword
            }

            ApiResponse<List<STIPackageResponse>> response = stiPackageService.searchPackages(keyword);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error searching STI packages: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to search STI packages"));
        }
    }

    /**
     * Xóa package (Admin only)
     */
    @DeleteMapping("/{packageId}")
    public ResponseEntity<ApiResponse<String>> deletePackage(
            @PathVariable Long packageId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Authentication required"));
            }

            ApiResponse<String> response = stiPackageService.deletePackage(packageId, userId);
            return ResponseEntity.status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                    .body(response);

        } catch (Exception e) {
            log.error("Error deleting STI package: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete STI package"));
        }
    }

    /**
     * Lấy tất cả packages cho admin/staff (bao gồm cả inactive)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<STIPackageResponse>>> getAllPackages() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            Long userId = userService.getUserIdFromUsername(username);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Authentication required"));
            }

            ApiResponse<List<STIPackageResponse>> response = stiPackageService.getAllPackages();
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrieving all STI packages: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve STI packages"));
        }
    }
}
