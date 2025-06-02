package com.healapp.service;

import com.healapp.dto.ApiResponse;
import com.healapp.dto.ConsultantProfileRequest;
import com.healapp.dto.ConsultantProfileResponse;
import com.healapp.model.ConsultantProfile;
import com.healapp.model.Role;
import com.healapp.model.UserDtls;
import com.healapp.repository.ConsultantProfileRepository;
import com.healapp.repository.RoleRepository;
import com.healapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConsultantService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConsultantProfileRepository consultantProfileRepository;

    @Autowired
    private RoleRepository roleRepository;

    public ApiResponse<List<ConsultantProfileResponse>> getAllConsultantProfiles() {
        try {
            // Cập nhật: Sử dụng findByRoleName thay vì findByRole
            List<UserDtls> consultantUsers = userRepository.findByRoleName("CONSULTANT");
            List<ConsultantProfileResponse> responses = consultantUsers.stream()
                    .map(user -> {
                        Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
                        if (profileOpt.isPresent()) {
                            return convertToResponse(profileOpt.get());
                        } else {
                            ConsultantProfileResponse response = new ConsultantProfileResponse();
                            response.setUserId(user.getId());
                            response.setFullName(user.getFullName());
                            response.setEmail(user.getEmail());
                            response.setPhone(user.getPhone());
                            response.setAvatar(user.getAvatar());
                            return response;
                        }
                    })
                    .collect(Collectors.toList());

            return ApiResponse.success("Consultant profiles retrieved successfully", responses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve consultant profiles: " + e.getMessage());
        }
    }

    public ApiResponse<ConsultantProfileResponse> getConsultantProfileById(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            // Cập nhật: Sử dụng getRoleName() thay vì getRole()
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is not a consultant");
            }

            Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
            if (profileOpt.isEmpty()) {
                ConsultantProfileResponse response = new ConsultantProfileResponse();
                response.setUserId(user.getId());
                response.setFullName(user.getFullName());
                response.setEmail(user.getEmail());
                response.setPhone(user.getPhone());
                response.setAvatar(user.getAvatar());
                return ApiResponse.success("Consultant found but profile not complete", response);
            }

            return ApiResponse.success("Consultant profile retrieved successfully",
                    convertToResponse(profileOpt.get()));
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve consultant profile: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<ConsultantProfileResponse> createOrUpdateConsultantProfile(Long userId,
            ConsultantProfileRequest request) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();

            // Cập nhật: Sử dụng getRoleName() thay vì getRole()
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User must have CONSULTANT role to update profile. Please update role first.");
            }

            // Tìm profile của user, tạo mới nếu chưa có
            ConsultantProfile consultantProfile = consultantProfileRepository.findByUser(user)
                    .orElse(new ConsultantProfile());

            consultantProfile.setUser(user);
            consultantProfile.setQualifications(request.getQualifications());
            consultantProfile.setExperience(request.getExperience());
            consultantProfile.setBio(request.getBio());

            ConsultantProfile savedProfile = consultantProfileRepository.save(consultantProfile);

            return ApiResponse.success("Consultant profile updated successfully", convertToResponse(savedProfile));
        } catch (Exception e) {
            return ApiResponse.error("Failed to update consultant profile: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<String> removeConsultantRole(Long userId) {
        try {
            Optional<UserDtls> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found");
            }

            UserDtls user = userOpt.get();
            // Cập nhật: Sử dụng getRoleName() thay vì getRole()
            if (!"CONSULTANT".equals(user.getRoleName())) {
                return ApiResponse.error("User is not a consultant");
            }

            // Xóa profile
            Optional<ConsultantProfile> profileOpt = consultantProfileRepository.findByUser(user);
            profileOpt.ifPresent(consultantProfileRepository::delete);

            // Cập nhật: Lấy role CUSTOMER từ database và set cho user
            Role userRole = roleRepository.findByRoleName("CUSTOMER")
                    .orElseThrow(() -> new RuntimeException("CUSTOMER role not found in database"));

            user.setRole(userRole);
            userRepository.save(user);

            return ApiResponse.success("Consultant role removed successfully", null);
        } catch (Exception e) {
            return ApiResponse.error("Failed to remove consultant role: " + e.getMessage());
        }
    }

    private ConsultantProfileResponse convertToResponse(ConsultantProfile consultantProfile) {
        ConsultantProfileResponse response = new ConsultantProfileResponse();
        response.setProfileId(consultantProfile.getProfileId());
        response.setUserId(consultantProfile.getUser().getId());
        response.setFullName(consultantProfile.getUser().getFullName());
        response.setEmail(consultantProfile.getUser().getEmail());
        response.setPhone(consultantProfile.getUser().getPhone());
        response.setAvatar(consultantProfile.getUser().getAvatar());
        response.setQualifications(consultantProfile.getQualifications());
        response.setExperience(consultantProfile.getExperience());
        response.setBio(consultantProfile.getBio());
        response.setUpdatedAt(consultantProfile.getUpdatedAt());
        return response;
    }
}