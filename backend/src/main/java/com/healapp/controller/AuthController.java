package com.healapp.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.healapp.config.JwtTokenProvider;
import com.healapp.dto.JwtResponse;
import com.healapp.dto.LoginRequest;
import com.healapp.dto.RefreshTokenRequest;
import com.healapp.dto.ApiResponse;
import com.healapp.model.UserDtls;
import com.healapp.service.UserService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", allowedHeaders = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));
            UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(userPrincipal.getUsername()); // Get user details
            UserDtls user = userService.getUserByUsername(userPrincipal.getUsername());            JwtResponse jwtResponse = new JwtResponse(
                    accessToken,
                    refreshToken,
                    "Bearer",    // tokenType
                    14400L,      // expiresIn (4 hours in seconds)
                    user.getId(), // userId
                    user.getUsername(),
                    user.getEmail(),
                    user.getRoleName());

            return ResponseEntity.ok(jwtResponse);
        } catch (AuthenticationException e) {
            log.error("Authentication failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<String>(false, "Invalid username or password"));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();
            if (!tokenProvider.validateToken(refreshToken)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<String>(false, "Invalid refresh token"));
            }

            String username = tokenProvider.getUsernameFromToken(refreshToken);
            UserDtls user = userService.getUserByUsername(username);

            if (user == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<String>(false, "User not found"));
            } // Create a proper UserDetails object for authentication
            UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                    .username(user.getUsername())
                    .password("") // Not needed for token generation
                    .authorities("ROLE_" + user.getRoleName())
                    .build();

            // Create authentication object for new access token
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            String newAccessToken = tokenProvider.generateAccessToken(authentication);
            String newRefreshToken = tokenProvider.generateRefreshToken(username);            JwtResponse jwtResponse = new JwtResponse(
                    newAccessToken,
                    newRefreshToken,
                    "Bearer",    // tokenType
                    14400L,      // expiresIn (4 hours in seconds)
                    user.getId(), // userId
                    user.getUsername(),
                    user.getEmail(),
                    user.getRoleName());

            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<String>(false, "Token refresh failed"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // For stateless JWT, logout is handled on the client side
        // by removing the token from storage
        return ResponseEntity.ok(new ApiResponse<String>(true, "Logout successful"));
    }
}
