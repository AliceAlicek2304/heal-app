package com.healapp.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.model.Role;
import com.healapp.repository.RoleRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    public ApiResponse<List<Role>> getAllRoles() {
        try {
            List<Role> roles = roleRepository.findAll();
            return ApiResponse.success("Roles retrieved successfully", roles);
        } catch (Exception e) {
            log.error("Error getting all roles: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to get roles: " + e.getMessage());
        }
    }

    public ApiResponse<Role> getRoleByName(String roleName) {
        try {
            Optional<Role> role = roleRepository.findByRoleName(roleName);
            if (role.isPresent()) {
                return ApiResponse.success("Role found", role.get());
            } else {
                return ApiResponse.error("Role not found: " + roleName);
            }
        } catch (Exception e) {
            log.error("Error getting role by name: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to get role: " + e.getMessage());
        }
    }    public Role getDefaultUserRole() {
        return roleRepository.findByRoleName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Default CUSTOMER role not found"));
    }

    public boolean isValidRole(String roleName) {
        return roleRepository.existsByRoleName(roleName);
    }

    public Role findByRoleName(String roleName) {
        return roleRepository.findByRoleName(roleName).orElse(null);
    }
}