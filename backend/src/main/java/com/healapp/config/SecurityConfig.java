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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;

import com.healapp.model.UserDtls;
import com.healapp.repository.UserRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserRepository userRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // ========= PUBLIC ENDPOINTS =========
                        // Static resources
                        .requestMatchers("/img/**").permitAll()

                        // API Authentication & User Management
                        .requestMatchers("/users/register", "/users/login", "/users/logout",
                                "/users/forgot-password", "/users/reset-password", "/users/send-verification")
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

                        // API Consultants (Public GET endpoints)
                        .requestMatchers(HttpMethod.GET, "/consultants").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultants/{userId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/consultations/consultant/{consultantId}").permitAll()

                        // API App Config
                        .requestMatchers(HttpMethod.GET, "/config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/config/consultation-price").permitAll()
                        // ========= AUTHENTICATED USER ENDPOINTS =========
                        // USER PROFILE MANAGEMENT
                        .requestMatchers(HttpMethod.GET, "/users/profile").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/profile/basic").authenticated()
                        .requestMatchers(HttpMethod.POST, "/users/profile/email/send-verification").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/profile/email").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/profile/password").authenticated()
                        .requestMatchers(HttpMethod.POST, "/users/profile/avatar").authenticated()

                        // API Blog cho người dùng đã xác thực
                        .requestMatchers(HttpMethod.POST, "/blog").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/blog/{postId}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/blog/{postId}").authenticated()

                        // API Questions cho người dùng đã xác thực
                        .requestMatchers(HttpMethod.POST, "/questions").authenticated()
                        .requestMatchers(HttpMethod.GET, "/questions/my-questions").authenticated()
                        .requestMatchers(HttpMethod.GET, "/questions/{questionId}").authenticated()
                        .requestMatchers(HttpMethod.GET, "/blog/my-posts").authenticated()

                        // API Consultations cho người dùng đã xác thực
                        .requestMatchers(HttpMethod.POST, "/consultations").authenticated()
                        .requestMatchers(HttpMethod.GET, "/consultations/my-consultations").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/consultations/{consultationId}/status").authenticated()

                        // ========= CONSULTANT ENDPOINTS =========
                        // API Consultant Profile Management
                        .requestMatchers(HttpMethod.PUT, "/consultants/profile").hasRole("CONSULTANT")

                        // API Questions (Consultant actions)
                        .requestMatchers(HttpMethod.PUT, "/questions/{questionId}/answer")
                        .hasAnyRole("STAFF", "CONSULTANT")
                        .requestMatchers(HttpMethod.GET, "/questions/category/{categoryId}")
                        .hasAnyRole("STAFF", "CONSULTANT")
                        .requestMatchers(HttpMethod.GET, "/questions/confirmed").hasAnyRole("STAFF", "CONSULTANT")

                        // API Consultations (Consultant actions)
                        .requestMatchers(HttpMethod.GET, "/consultations/assigned").hasRole("CONSULTANT")

                        // ========= STAFF ENDPOINTS =========
                        // API Blog Management
                        .requestMatchers(HttpMethod.PUT, "/blog/{postId}/status").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/blog/processing").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/blog/status/{status}").hasAnyRole("STAFF", "ADMIN")
                        // API Question Categories Management
                        .requestMatchers(HttpMethod.POST, "/question-categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/question-categories/{categoryId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/question-categories/{categoryId}").hasRole("ADMIN")

                        // API Questions
                        .requestMatchers(HttpMethod.PUT, "/questions/{questionId}/status").hasRole("STAFF")
                        .requestMatchers(HttpMethod.GET, "/questions/status/{status}").hasRole("STAFF")
                        .requestMatchers(HttpMethod.GET, "/questions/processing").hasRole("STAFF")
                        .requestMatchers(HttpMethod.DELETE, "/questions/{questionId}").hasRole("STAFF")

                        // ========= ADMIN ENDPOINTS =========
                        // API Category
                        .requestMatchers(HttpMethod.POST, "/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/categories/{categoryId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/categories/{categoryId}").hasRole("ADMIN")

                        // API Consultant
                        .requestMatchers(HttpMethod.POST, "/consultants/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/consultants/{userId}").hasRole("ADMIN")

                        // API User & Admin
                        .requestMatchers(HttpMethod.GET, "/admin/consultants").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/consultants/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/admin/consultants/{userId}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users/roles").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users/count").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users/{userId}").hasRole("ADMIN")
                        // Update role user (STAFF, CONSULTANT, ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/admin/users/{userId}").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // API STI service public
                        .requestMatchers(HttpMethod.GET, "/sti-services").permitAll()
                        .requestMatchers(HttpMethod.GET, "/sti-services/{serviceId}").permitAll()

                        // API App Config
                        .requestMatchers(HttpMethod.GET, "/admin/config").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/config").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/config/consultation-price").hasRole("ADMIN")

                        // API Chatbot
                        .requestMatchers("/chatbot").permitAll()
                        .requestMatchers("/chatbot/history").authenticated()

                        // Default rule: all other endpoints require authentication
                        .anyRequest().authenticated())

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
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole()));

            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(),
                    user.getIsActive(), // enabled
                    true, // accountNonExpired
                    true, // credentialsNonExpired
                    true, // accountNonLocked
                    authorities);
        };
    }
}