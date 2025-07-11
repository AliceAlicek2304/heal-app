package com.healapp.config;

import java.util.ArrayList;
import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.healapp.model.UserDtls;
import com.healapp.repository.UserRepository;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                // ========= PUBLIC ENDPOINTS =========
                // Static resources
                .requestMatchers("/img/**").permitAll()
                .requestMatchers("/uploads/avatar/**").permitAll() // Cho phép truy cập công khai avatar
                // API Authentication & User Management
                .requestMatchers("/users/register", "/users/login", "/users/logout",
                        "/users/forgot-password", "/users/reset-password", "/users/send-verification")
                .permitAll()
                // JWT Authentication endpoints
                .requestMatchers("/auth/login", "/auth/refresh-token", "/auth/logout")
                .permitAll()
                // OAuth Authentication endpoints
                .requestMatchers("/auth/oauth/google/login", "/auth/oauth/facebook/login")
                .permitAll()
                // API Blog (Public GET endpoints)
                .requestMatchers(HttpMethod.GET, "/blog").permitAll()
                .requestMatchers(HttpMethod.GET, "/blog/{postId}").permitAll()
                .requestMatchers(HttpMethod.GET, "/blog/{postId}/related").permitAll()
                .requestMatchers(HttpMethod.GET, "/blog/category/{categoryId}").permitAll()
                .requestMatchers(HttpMethod.GET, "/blog/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/blog/latest").permitAll()
                // API Category (Public GET endpoints)
                .requestMatchers(HttpMethod.GET, "/categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/categories/{categoryId}").permitAll()
                // API Question Categories (Public GET endpoints)
                .requestMatchers(HttpMethod.GET, "/question-categories").permitAll()
                .requestMatchers(HttpMethod.GET, "/question-categories/{categoryId}").permitAll()
                .requestMatchers(HttpMethod.GET, "/questions/answered").permitAll()
                .requestMatchers(HttpMethod.GET, "/questions/search").permitAll()
                // API STI Services (Public endpoints)
                .requestMatchers(HttpMethod.GET, "/sti-services").permitAll()
                .requestMatchers(HttpMethod.GET, "/sti-services/{serviceId}").permitAll()
                // API STI Packages (Public endpoints)
                .requestMatchers(HttpMethod.GET, "/sti-packages/active").permitAll()
                .requestMatchers(HttpMethod.GET, "/sti-packages/{packageId}").permitAll()
                .requestMatchers(HttpMethod.GET, "/sti-packages/search").permitAll()
                // API Ratings (Public endpoints)
                .requestMatchers(HttpMethod.GET, "/ratings/consultant/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/ratings/sti-service/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/ratings/sti-package/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/ratings/summary/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/ratings/testimonials").permitAll()
                // API Consultations (Public endpoints)
                .requestMatchers(HttpMethod.GET, "/consultations/consultants").permitAll()
                .requestMatchers(HttpMethod.GET, "/consultations/available-slots").permitAll()
                // API Chatbot (Public endpoints)
                .requestMatchers(HttpMethod.POST, "/chatbot").permitAll() // Test endpoints
                .requestMatchers("/test/public").permitAll()
                .requestMatchers("/test/auth").authenticated()
                .requestMatchers("/test/my-posts-debug").authenticated()
                // ========= AUTHENTICATED USER ENDPOINTS ========= // USER PROFILE MANAGEMENT
                .requestMatchers(HttpMethod.GET, "/users/profile").authenticated()
                .requestMatchers(HttpMethod.PUT, "/users/profile/basic").authenticated()
                .requestMatchers(HttpMethod.POST, "/users/profile/email/send-verification").authenticated()
                .requestMatchers(HttpMethod.PUT, "/users/profile/email").authenticated()
                .requestMatchers(HttpMethod.PUT, "/users/profile/password").authenticated()
                .requestMatchers(HttpMethod.POST, "/users/profile/avatar").authenticated()
                // PHONE VERIFICATION MANAGEMENT
                .requestMatchers(HttpMethod.POST, "/users/profile/phone/send-verification").authenticated()
                .requestMatchers(HttpMethod.POST, "/users/profile/phone/verify").authenticated()
                .requestMatchers(HttpMethod.GET, "/users/profile/phone/status").authenticated()
                // API Blog (Authenticated user endpoints)
                .requestMatchers(HttpMethod.POST, "/blog").authenticated()
                .requestMatchers(HttpMethod.PUT, "/blog/{postId}").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/blog/{postId}").authenticated()
                .requestMatchers(HttpMethod.GET, "/blog/my-posts").authenticated()
                // API Questions (Authenticated user endpoints)
                .requestMatchers(HttpMethod.POST, "/questions").authenticated()
                .requestMatchers(HttpMethod.GET, "/questions/my-questions").authenticated()
                .requestMatchers(HttpMethod.GET, "/questions/{questionId}").authenticated()
                // API Consultations (Authenticated user endpoints)
                .requestMatchers(HttpMethod.POST, "/consultations").authenticated()
                .requestMatchers(HttpMethod.GET, "/consultations/my-consultations").authenticated()
                .requestMatchers(HttpMethod.PUT, "/consultations/{consultationId}/status").authenticated()
                .requestMatchers(HttpMethod.GET, "/consultations/status/{status}").authenticated()
                // API STI Services (Authenticated user endpoints)
                .requestMatchers(HttpMethod.POST, "/sti-services/book-test").authenticated()
                .requestMatchers(HttpMethod.GET, "/sti-services/my-tests").authenticated()
                .requestMatchers(HttpMethod.GET, "/sti-services/tests/{testId}").authenticated()
                .requestMatchers(HttpMethod.PUT, "/sti-services/tests/{testId}/cancel").authenticated()
                .requestMatchers(HttpMethod.GET, "/sti-services/tests/{testId}/results").authenticated()
                .requestMatchers(HttpMethod.POST, "/menstrual-cycle/addCycle").authenticated()
                .requestMatchers(HttpMethod.POST, "/menstrual-cycle/calculate").permitAll()
                .requestMatchers(HttpMethod.GET, "/menstrual-cycle/my-cycles").authenticated()
                .requestMatchers(HttpMethod.GET, "/menstrual-cycle/{userId}").authenticated()
                .requestMatchers(HttpMethod.PUT, "/menstrual-cycle/{id}").authenticated()
                .requestMatchers(HttpMethod.PUT, "/menstrual-cycle/{id}/reminder").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/menstrual-cycle/{id}").authenticated()
                // AI Analysis endpoints
                .requestMatchers(HttpMethod.GET, "/menstrual-cycle/ai/personal-analysis").authenticated()
                .requestMatchers(HttpMethod.GET, "/menstrual-cycle/ai/health-analysis").authenticated()
                .requestMatchers(HttpMethod.GET, "/menstrual-cycle/ai/comparative-analysis").authenticated()
                // API Chatbot History (Authenticated user endpoints)
                .requestMatchers(HttpMethod.GET, "/chatbot/history").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/chatbot/history").authenticated()
                // API Ratings (Authenticated user endpoints)
                .requestMatchers(HttpMethod.POST, "/ratings/consultant/**").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.POST, "/ratings/sti-service/**").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.PUT, "/ratings/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/ratings/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/ratings/my-ratings").authenticated()
                .requestMatchers(HttpMethod.GET, "/ratings/can-rate/**").hasRole("CUSTOMER")
                // API PaymentInfo (Authenticated user endpoints)
                .requestMatchers(HttpMethod.GET, "/payment-info").authenticated()
                .requestMatchers(HttpMethod.POST, "/payment-info").authenticated()
                .requestMatchers(HttpMethod.PUT, "/payment-info/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/payment-info/**").authenticated()
                // ========= CONSULTANT ENDPOINTS =========
                // API Consultant Profile Management
                .requestMatchers(HttpMethod.PUT, "/consultants/profile").hasRole("CONSULTANT")
                // API Questions (Consultant actions)
                .requestMatchers(HttpMethod.PUT, "/questions/{questionId}/answer")
                .hasAnyRole("STAFF", "CONSULTANT")
                .requestMatchers(HttpMethod.GET, "/questions/category/{categoryId}")
                .hasAnyRole("STAFF", "CONSULTANT")
                // API Consultations (Consultant actions)
                .requestMatchers(HttpMethod.GET, "/consultations/assigned").hasRole("CONSULTANT")
                // API STI Services (Consultant actions)
                .requestMatchers(HttpMethod.PUT, "/sti-services/consultant/tests/{testId}/notes")
                .hasRole("CONSULTANT")
                // Cho phép tất cả OPTIONS request (CORS preflight) đi qua mà không cần xác thực
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // ========= STAFF ENDPOINTS =========
                // API Staff Ratings Management
                .requestMatchers("/staff/ratings/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers("/ratings/staff/**").hasAnyRole("STAFF", "ADMIN")
                // ========= STAFF ENDPOINTS =========
                // API Blog Management (Staff)
                .requestMatchers(HttpMethod.PUT, "/blog/{postId}/status").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/blog/status/{status}").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/question-categories").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PUT, "/question-categories/{categoryId}")
                .hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/question-categories/{categoryId}")
                .hasAnyRole("ADMIN", "STAFF")
                // API Questions (Staff actions)
                .requestMatchers(HttpMethod.PUT, "/questions/{questionId}/status").hasRole("STAFF")
                .requestMatchers(HttpMethod.GET, "/questions/status/{status}").hasAnyRole("STAFF", "CONSULTANT")
                .requestMatchers(HttpMethod.DELETE, "/questions/{questionId}").hasRole("STAFF")
                .requestMatchers(HttpMethod.GET, "/sti-services/staff/pending-tests")
                .hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/sti-services/staff/tests/{testId}/confirm")
                .hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/sti-services/staff/confirmed-tests")
                .hasRole("STAFF")
                .requestMatchers(HttpMethod.PUT, "/sti-services/staff/tests/{testId}/sample")
                .hasRole("STAFF")
                .requestMatchers(HttpMethod.GET, "/sti-services/staff/my-tests")
                .hasRole("STAFF")
                .requestMatchers(HttpMethod.PUT, "/sti-services/staff/tests/{testId}/result")
                .hasRole("STAFF")
                .requestMatchers(HttpMethod.PUT, "/sti-services/staff/tests/{testId}/complete")
                .hasRole("STAFF")
                // API Staff Management (Staff endpoints)
                .requestMatchers("/staff/**").hasRole("STAFF")
                // ========= ADMIN ENDPOINTS =========
                // API STI Package Management (Admin/Staff)
                .requestMatchers(HttpMethod.POST, "/sti-packages").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PUT, "/sti-packages/{packageId}").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/sti-packages/{packageId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/categories").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PUT, "/categories/{categoryId}").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.DELETE, "/categories/{categoryId}").hasAnyRole("ADMIN", "STAFF")
                // API Consultant Management (Admin only)
                .requestMatchers(HttpMethod.POST, "/consultants/{userId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/consultants/{userId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/consultants").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/admin/consultants/{userId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/admin/consultants/{userId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/users").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/users/roles").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/users/count").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/users/{userId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/admin/users/{userId}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/overview").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/revenue").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/revenue/compare").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/activities").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/top-consultants").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/top-sti-services").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/top-sti-packages").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/stats/revenue-distribution").hasRole("ADMIN")
                // AI Dashboard Analysis APIs
                .requestMatchers(HttpMethod.GET, "/admin/ai-dashboard/analysis").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/ai-dashboard/detailed-report").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/admin/config").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/admin/config").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/admin/config").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/admin/config/{key}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/admin/config/{key}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/admin/config/{key}/inactive").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/admin/config/{key}/active").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/admin/config/{key}/upload").hasRole("ADMIN")
                // All other admin endpoints
                .requestMatchers("/admin/**").hasRole("ADMIN") // Default rule: all other endpoints require
                // authentication
                .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .httpBasic(Customizer.withDefaults())
                .cors(Customizer.withDefaults())
                .logout(logout -> logout
                .logoutUrl("/users/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(HttpServletResponse.SC_OK);
                    response.getWriter().write("{\"success\":true,\"message\":\"Logout successfully\"}");
                    response.setContentType("application/json");
                })
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID"));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            UserDtls user = userRepository.findByUsername(username)
                    .orElse(null);

            if (user == null) {
                throw new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
            }

            Collection<SimpleGrantedAuthority> authorities = new ArrayList<>();
            String roleName = user.getRoleName();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));

            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(),
                    user.getIsActive(),
                    true,
                    true,
                    true,
                    authorities);
        };
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of(
                "http://localhost:3000",
                "https://AliceAlicek2304.github.io",
                "https://alicealicek2304.github.io"
        ));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
