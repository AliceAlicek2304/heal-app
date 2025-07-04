package com.healapp.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.MenstrualCycleRequest;
import com.healapp.dto.MenstrualCycleResponse;
import com.healapp.dto.ReminderRequest;
import com.healapp.service.MenstrualCycleService;
import com.healapp.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/menstrual-cycle")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", allowedHeaders = "*")
public class MenstrualCycleController {

    @Autowired
    private MenstrualCycleService menstrualCycleService;

    @Autowired
    private UserService userService;

    @PostMapping("/addCycle")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MenstrualCycleResponse>> addCycle(
            @RequestBody @Valid MenstrualCycleRequest request) {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để xử lý
            ApiResponse<MenstrualCycleResponse> response = menstrualCycleService.addCycle(request, userId);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    // Endpoint tính toán chu kỳ kinh nguyệt không lưu vào database
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<MenstrualCycleResponse>> calculateCycle(
            @RequestBody @Valid MenstrualCycleRequest request) {
        try {
            // Kiểm tra xem user có đăng nhập không
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long userId = null;
            
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                try {
                    String username = auth.getName();
                    userId = userService.getUserIdFromUsername(username);
                } catch (Exception e) {
                    // User đăng nhập nhưng không tìm thấy, tính toán như guest
                    userId = null;
                }
            }

            // Gọi service để tính toán (với userId nếu đã đăng nhập)
            ApiResponse<MenstrualCycleResponse> response;
            if (userId != null) {
                // User đã đăng nhập - tính toán với phân tích lịch sử
                response = menstrualCycleService.calculateCycleWithHistory(request, userId);
            } else {
                // User chưa đăng nhập - tính toán cơ bản
                response = menstrualCycleService.calculateCycle(request);
            }
            
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    // Endpoint mới: Lấy chu kỳ của current user (giống như STI /my-tests)
    @GetMapping("/my-cycles")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MenstrualCycleResponse>>> getMyMenstrualCycles() {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để lấy thông tin chu kỳ kinh nguyệt
            ApiResponse<List<MenstrualCycleResponse>> response = menstrualCycleService.getAllCycleByUserId(userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MenstrualCycleResponse>>> getAllCycleByUserId(@PathVariable Long userId) {
        try {
            // Kiểm tra quyền truy cập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Gọi service để lấy thông tin chu kỳ kinh nguyệt
            ApiResponse<List<MenstrualCycleResponse>> response = menstrualCycleService.getAllCycleByUserId(userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    // cap nhat chu kỳ kinh nguyệt
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MenstrualCycleResponse>> updateCycle(
            @PathVariable Long id,
            @RequestBody @Valid MenstrualCycleRequest request) {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để cập nhật chu kỳ kinh nguyệt
            ApiResponse<MenstrualCycleResponse> response = menstrualCycleService.updateCycle(id, request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/reminder")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MenstrualCycleResponse>> toggleReminder(
            @PathVariable Long id,
            @RequestBody @Valid ReminderRequest request) {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Lấy userId từ username
            String username = auth.getName();
            Long userId = userService.getUserIdFromUsername(username);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found"));
            }

            // Gọi service để thiết lập nhắc nhở
            ApiResponse<MenstrualCycleResponse> response = menstrualCycleService.toggleReminder(id, request, userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

    // Xóa chu kỳ kinh nguyệt
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteCycle(@PathVariable Long id) {
        try {
            // Lấy thông tin user đang đăng nhập
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not authenticated"));
            }

            // Gọi service để xóa chu kỳ kinh nguyệt
            ApiResponse<String> response = menstrualCycleService.deleteCycle(id);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error: " + e.getMessage()));
        }
    }

}