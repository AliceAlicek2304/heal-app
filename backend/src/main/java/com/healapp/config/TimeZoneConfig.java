package com.healapp.config;

import java.util.TimeZone;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import jakarta.annotation.PostConstruct;

@Configuration
public class TimeZoneConfig {

    /**
     * Set default timezone for the entire application to Vietnam timezone
     * This ensures all date/time operations use Asia/Ho_Chi_Minh (UTC+7)
     */
    @PostConstruct
    public void setDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        System.out.println("Default timezone set to: " + TimeZone.getDefault().getID());
    }

    /**
     * Bean to provide Vietnam timezone for dependency injection
     */
    @Bean
    @Primary
    public TimeZone vietnamTimeZone() {
        return TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
    }
} 