package com.healapp.config;

import java.util.ArrayList;
import java.util.Collection;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

import com.healapp.model.UserDtls;
import com.healapp.repository.UserRepository;

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
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // ========= PUBLIC ENDPOINTS =========
                        // Static resources
                        .requestMatchers("/img/**").permitAll() // API Authentication & User Management
                        .requestMatchers("/users/register", "/users/login", "/users/logout",
                                "/users/forgot-password", "/users/reset-password", "/users/send-verification")
                        .permitAll()

                        // JWT Authentication endpoints
                        .requestMatchers("/auth/login", "/auth/refresh-token", "/auth/logout")
                        .permitAll()

                        // API Blog (Public GET endpoints)
                        .requestMatchers(HttpMethod.GET, "/blog").permitAll()
                        .requestMatchers(HttpMethod.GET, "/blog/{postId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/blog/category/{categoryId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/blog/search").permitAll()

                        // API Category (Public GET endpoints)
                        .requestMatchers(HttpMethod.GET, "/categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/categories/{categoryId}").permitAll()

                        // API Question Categories (Public GET endpoints)
                        .requestMatchers(HttpMethod.GET, "/question-categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/question-categories/{categoryId}").permitAll()

                        // API Questions (Public endpoints)
                        .requestMatchers(HttpMethod.GET, "/questions/answered").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultants").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultants/{userId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultations/consultant/{consultantId}/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultations/consultants").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultations/available-slots").permitAll()

                        // API App Config (Public endpoints)
                        .requestMatchers(HttpMethod.GET, "/config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/config/{key}").permitAll()

                        // API STI Services (Public GET endpoints)
                        .requestMatchers(HttpMethod.GET, "/sti-services").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sti-services/{serviceId}").permitAll()                        // API Chatbot (Public endpoints)
                        .requestMatchers(HttpMethod.POST, "/chatbot").permitAll()                        // Test endpoints
                        .requestMatchers("/test/public").permitAll()
                        .requestMatchers("/test/auth").authenticated()
                        .requestMatchers("/test/my-posts-debug").authenticated()

                        // ========= AUTHENTICATED USER ENDPOINTS =========
                        // USER PROFILE MANAGEMENT
                        .requestMatchers(HttpMethod.GET, "/users/profile").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/profile/basic").authenticated()
                        .requestMatchers(HttpMethod.POST, "/users/profile/email/send-verification").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/profile/email").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/profile/password").authenticated()
                        .requestMatchers(HttpMethod.POST, "/users/profile/avatar").authenticated()

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
                        .requestMatchers(HttpMethod.GET, "/sti-services/tests/{testId}/results").authenticated()                        // API Menstrual Cycle (Authenticated user endpoints)
                        .requestMatchers(HttpMethod.POST, "/menstrual-cycle/addCycle").authenticated()
                        .requestMatchers(HttpMethod.GET, "/menstrual-cycle/my-cycles").authenticated()
                        .requestMatchers(HttpMethod.GET, "/menstrual-cycle/{userId}").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/menstrual-cycle/{id}").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/menstrual-cycle/{id}/reminder").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/menstrual-cycle/{id}").authenticated()

                        // API Chatbot History (Authenticated user endpoints)
                        .requestMatchers(HttpMethod.GET, "/chatbot/history").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/chatbot/history").authenticated()

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

                        // ========= STAFF ENDPOINTS =========
                        // API Blog Management (Staff)
                        .requestMatchers(HttpMethod.PUT, "/blog/{postId}/status").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/blog/status/{status}").hasAnyRole("STAFF", "ADMIN")

                        // API Question Categories Management (Staff - Admin only)
                        .requestMatchers(HttpMethod.POST, "/question-categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/question-categories/{categoryId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/question-categories/{categoryId}").hasRole("ADMIN")

                        // API Questions (Staff actions)
                        .requestMatchers(HttpMethod.PUT, "/questions/{questionId}/status").hasRole("STAFF")
                        .requestMatchers(HttpMethod.GET, "/questions/status/{status}").hasAnyRole("STAFF", "CONSULTANT")
                        .requestMatchers(HttpMethod.DELETE, "/questions/{questionId}").hasRole("STAFF")

                        // API STI Services (Staff actions)
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

                        // ========= ADMIN ENDPOINTS =========
                        // API Category Management (Admin only)
                        .requestMatchers(HttpMethod.POST, "/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/categories/{categoryId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/categories/{categoryId}").hasRole("ADMIN")

                        // API Consultant Management (Admin only)
                        .requestMatchers(HttpMethod.POST, "/consultants/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/consultants/{userId}").hasRole("ADMIN")

                        // API User & Admin Management (Admin only)
                        .requestMatchers(HttpMethod.GET, "/admin/consultants").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/consultants/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/admin/consultants/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users/roles").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users/count").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/users/{userId}").hasRole("ADMIN")

                        // API App Config Management (Admin only)
                        .requestMatchers(HttpMethod.GET, "/admin/config").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/config").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/config").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/admin/config/{key}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/config/{key}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/config/{key}/inactive").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/config/{key}/active").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/config/{key}/upload").hasRole("ADMIN")

                        // API STI Services Management (Admin only)
                        .requestMatchers(HttpMethod.POST, "/admin/sti-services").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/sti-services/{serviceId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/sti-services/{serviceId}").hasRole("ADMIN")

                        // All other admin endpoints
                        .requestMatchers("/admin/**").hasRole("ADMIN")                        // Default rule: all other endpoints require authentication
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
}