package com.healapp.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.TimeZone;

/**
 * Utility class for handling timezone operations consistently across the application
 * Ensures all date/time operations use Vietnam timezone (Asia/Ho_Chi_Minh)
 */
public class TimeZoneUtils {

    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final String VIETNAM_ZONE_ID = "Asia/Ho_Chi_Minh";

    /**
     * Get current time in Vietnam timezone
     */
    public static ZonedDateTime nowVietnam() {
        return ZonedDateTime.now(VIETNAM_ZONE);
    }

    /**
     * Get current local date time in Vietnam timezone
     */
    public static LocalDateTime nowLocalVietnam() {
        return nowVietnam().toLocalDateTime();
    }

    /**
     * Get current local date in Vietnam timezone
     */
    public static LocalDate todayVietnam() {
        return nowVietnam().toLocalDate();
    }

    /**
     * Convert a LocalDateTime to Vietnam timezone
     */
    public static ZonedDateTime toVietnamTime(LocalDateTime localDateTime) {
        return localDateTime.atZone(VIETNAM_ZONE);
    }

    /**
     * Convert a LocalDate to Vietnam timezone at start of day
     */
    public static ZonedDateTime toVietnamTimeStartOfDay(LocalDate localDate) {
        return localDate.atStartOfDay(VIETNAM_ZONE);
    }

    /**
     * Convert a LocalDate to Vietnam timezone at end of day
     */
    public static ZonedDateTime toVietnamTimeEndOfDay(LocalDate localDate) {
        return localDate.atTime(23, 59, 59).atZone(VIETNAM_ZONE);
    }

    /**
     * Get tomorrow's date in Vietnam timezone
     */
    public static LocalDate tomorrowVietnam() {
        return todayVietnam().plusDays(1);
    }

    /**
     * Check if a date is today in Vietnam timezone
     */
    public static boolean isToday(LocalDate date) {
        return date.equals(todayVietnam());
    }

    /**
     * Check if a date is tomorrow in Vietnam timezone
     */
    public static boolean isTomorrow(LocalDate date) {
        return date.equals(tomorrowVietnam());
    }

    /**
     * Get the default timezone for the application
     */
    public static TimeZone getDefaultTimeZone() {
        return TimeZone.getTimeZone(VIETNAM_ZONE);
    }

    /**
     * Format current time for logging purposes
     */
    public static String getCurrentTimeForLog() {
        return nowVietnam().toString();
    }
} 