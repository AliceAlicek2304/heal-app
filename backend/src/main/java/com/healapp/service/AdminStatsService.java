package com.healapp.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.model.ConsultationStatus;
import com.healapp.model.PaymentStatus;
import com.healapp.model.TestStatus;
import com.healapp.repository.ConsultationRepository;
import com.healapp.repository.PaymentRepository;
import com.healapp.repository.STITestRepository;
import com.healapp.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AdminStatsService {

    @Autowired
    private UserService userService;

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private STITestRepository stiTestRepository;

    @Autowired
    private UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Lấy thống kê tổng quan cho dashboard admin
     */
    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Thống kê người dùng theo role
            ApiResponse<Map<String, Long>> userStatsResponse = userService.getUserCountByRole();
            if (userStatsResponse.isSuccess()) {
                Map<String, Long> userStats = userStatsResponse.getData();
                stats.put("totalUsers", userStats.getOrDefault("TOTAL", 0L));
                stats.put("totalConsultants", userStats.getOrDefault("CONSULTANT", 0L));
                stats.put("totalPatients", userStats.getOrDefault("USER", 0L));
            } else {
                // Fallback nếu không lấy được từ UserService
                stats.put("totalUsers", userRepository.count());
                stats.put("totalConsultants", 0L);
                stats.put("totalPatients", 0L);
            }

            // Tổng số xét nghiệm STI
            Long totalSTITests = stiTestRepository.count();
            stats.put("totalSTITests", totalSTITests);

            // Tổng số tư vấn
            Long totalConsultations = consultationRepository.count();
            stats.put("totalConsultations", totalConsultations);

            // Tổng doanh thu
            BigDecimal totalRevenue = getTotalRevenue();
            stats.put("totalRevenue", totalRevenue);            // Thêm các KPI kinh doanh quan trọng
            addBusinessKPIs(stats, totalRevenue);

            log.info("Overview stats retrieved successfully");

        } catch (Exception e) {
            log.error("Error getting overview stats: {}", e.getMessage());
            stats.put("error", e.getMessage());
        }

        return stats;
    }

    /**
     * Lấy thống kê doanh thu theo period (monthly, quarterly, yearly)
     */
    public Map<String, Object> getRevenueStats(String period, Integer year, Integer month) {
        Map<String, Object> result = new HashMap<>();

        try {
            LocalDateTime now = LocalDateTime.now();

            // Xác định năm nếu không được cung cấp
            if (year == null) {
                year = now.getYear();
            }

            LocalDateTime startDate, endDate;

            switch (period.toLowerCase()) {
                case "yearly":
                    startDate = LocalDateTime.of(year, 1, 1, 0, 0);
                    endDate = LocalDateTime.of(year, 12, 31, 23, 59, 59);
                    result.put("period", "Năm " + year);
                    result.put("periodType", "yearly");

                    // Lấy dữ liệu theo từng tháng trong năm
                    List<Map<String, Object>> monthlyData = getMonthlyRevenueData(year);
                    result.put("chartData", monthlyData);
                    break;

                case "quarterly":
                    int quarter = month != null ? ((month - 1) / 3) + 1 : ((now.getMonthValue() - 1) / 3) + 1;
                    int startMonth = (quarter - 1) * 3 + 1;
                    int endMonth = quarter * 3;

                    startDate = LocalDateTime.of(year, startMonth, 1, 0, 0);
                    endDate = LocalDateTime.of(year, endMonth,
                            LocalDateTime.of(year, endMonth, 1, 0, 0).toLocalDate().lengthOfMonth(), 23, 59, 59);

                    result.put("period", "Quý " + quarter + " năm " + year);
                    result.put("periodType", "quarterly");
                    result.put("quarter", quarter);

                    // Lấy dữ liệu theo từng tháng trong quý
                    List<Map<String, Object>> quarterlyData = getQuarterlyRevenueData(year, quarter);
                    result.put("chartData", quarterlyData);
                    break;

                case "monthly":
                default:
                    if (month == null) {
                        month = now.getMonthValue();
                    }

                    startDate = LocalDateTime.of(year, month, 1, 0, 0);
                    endDate = LocalDateTime.of(year, month,
                            LocalDateTime.of(year, month, 1, 0, 0).toLocalDate().lengthOfMonth(), 23, 59, 59);

                    result.put("period", "Tháng " + month + " năm " + year);
                    result.put("periodType", "monthly");
                    result.put("month", month);

                    // Lấy dữ liệu theo từng ngày trong tháng (có thể implement sau)
                    List<Map<String, Object>> dailyData = getDailyRevenueData(year, month);
                    result.put("chartData", dailyData);
                    break;
            }

            // Tính tổng doanh thu và số giao dịch trong khoảng thời gian
            BigDecimal totalRevenue = calculateRevenueInPeriod(startDate, endDate);
            Long totalTransactions = calculateTransactionsInPeriod(startDate, endDate);

            result.put("totalRevenue", totalRevenue);
            result.put("totalTransactions", totalTransactions);
            result.put("startDate", startDate);
            result.put("endDate", endDate);
            result.put("year", year);

            log.info("Revenue stats retrieved successfully for period: {}", period);

        } catch (Exception e) {
            log.error("Error getting revenue stats: {}", e.getMessage());
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Lấy dữ liệu doanh thu theo từng tháng trong năm
     */
    private List<Map<String, Object>> getMonthlyRevenueData(int year) {
        List<Map<String, Object>> monthlyData = new ArrayList<>();

        for (int m = 1; m <= 12; m++) {
            LocalDateTime monthStart = LocalDateTime.of(year, m, 1, 0, 0);
            LocalDateTime monthEnd = LocalDateTime.of(year, m,
                    LocalDateTime.of(year, m, 1, 0, 0).toLocalDate().lengthOfMonth(), 23, 59, 59);

            BigDecimal monthRevenue = calculateRevenueInPeriod(monthStart, monthEnd);
            Long monthTransactions = calculateTransactionsInPeriod(monthStart, monthEnd);

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", m);
            monthData.put("monthName", Month.of(m).name());
            monthData.put("monthNameVN", getVietnameseMonthName(m));
            monthData.put("revenue", monthRevenue);
            monthData.put("transactions", monthTransactions);
            monthData.put("period", "Tháng " + m);

            monthlyData.add(monthData);
        }

        return monthlyData;
    }

    /**
     * Lấy dữ liệu doanh thu theo từng tháng trong quý
     */
    private List<Map<String, Object>> getQuarterlyRevenueData(int year, int quarter) {
        List<Map<String, Object>> quarterlyData = new ArrayList<>();

        int startMonth = (quarter - 1) * 3 + 1;
        int endMonth = quarter * 3;

        for (int m = startMonth; m <= endMonth; m++) {
            LocalDateTime monthStart = LocalDateTime.of(year, m, 1, 0, 0);
            LocalDateTime monthEnd = LocalDateTime.of(year, m,
                    LocalDateTime.of(year, m, 1, 0, 0).toLocalDate().lengthOfMonth(), 23, 59, 59);

            BigDecimal monthRevenue = calculateRevenueInPeriod(monthStart, monthEnd);
            Long monthTransactions = calculateTransactionsInPeriod(monthStart, monthEnd);

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", m);
            monthData.put("monthName", Month.of(m).name());
            monthData.put("monthNameVN", getVietnameseMonthName(m));
            monthData.put("revenue", monthRevenue);
            monthData.put("transactions", monthTransactions);
            monthData.put("period", "Tháng " + m);

            quarterlyData.add(monthData);
        }

        return quarterlyData;
    }

    /**
     * Lấy dữ liệu doanh thu theo từng tuần trong tháng (đơn giản hóa)
     */
    private List<Map<String, Object>> getDailyRevenueData(int year, int month) {
        List<Map<String, Object>> weeklyData = new ArrayList<>();

        // Chia tháng thành 4 tuần (đơn giản)
        int daysInMonth = LocalDateTime.of(year, month, 1, 0, 0).toLocalDate().lengthOfMonth();
        int weekSize = daysInMonth / 4;

        for (int week = 1; week <= 4; week++) {
            int startDay = (week - 1) * weekSize + 1;
            int endDay = week == 4 ? daysInMonth : week * weekSize;

            LocalDateTime weekStart = LocalDateTime.of(year, month, startDay, 0, 0);
            LocalDateTime weekEnd = LocalDateTime.of(year, month, endDay, 23, 59, 59);

            BigDecimal weekRevenue = calculateRevenueInPeriod(weekStart, weekEnd);
            Long weekTransactions = calculateTransactionsInPeriod(weekStart, weekEnd);

            Map<String, Object> weekData = new HashMap<>();
            weekData.put("week", week);
            weekData.put("weekName", "Tuần " + week);
            weekData.put("revenue", weekRevenue);
            weekData.put("transactions", weekTransactions);
            weekData.put("period", "Tuần " + week + " (ngày " + startDay + "-" + endDay + ")");

            weeklyData.add(weekData);
        }

        return weeklyData;
    }

    /**
     * Tính tổng doanh thu trong khoảng thời gian
     */
    private BigDecimal calculateRevenueInPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            // Sử dụng EntityManager để thực hiện custom query
            BigDecimal revenue = entityManager
                    .createQuery(
                            "SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = :status AND p.createdAt >= :startDate AND p.createdAt <= :endDate",
                            BigDecimal.class)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getSingleResult();

            return revenue != null ? revenue : BigDecimal.ZERO;
        } catch (Exception e) {
            log.error("Error calculating revenue in period: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    /**
     * Đếm số giao dịch trong khoảng thời gian
     */
    private Long calculateTransactionsInPeriod(LocalDateTime startDate, LocalDateTime endDate) {
        try {
            // Sử dụng EntityManager để thực hiện custom query
            Long count = entityManager
                    .createQuery(
                            "SELECT COUNT(p) FROM Payment p WHERE p.paymentStatus = :status AND p.createdAt >= :startDate AND p.createdAt <= :endDate",
                            Long.class)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getSingleResult();

            return count != null ? count : 0L;
        } catch (Exception e) {
            log.error("Error calculating transactions in period: {}", e.getMessage());
            return 0L;
        }
    }

    /**
     * Lấy tổng doanh thu từ trước đến nay
     */
    private BigDecimal getTotalRevenue() {
        try {
            BigDecimal total = paymentRepository.sumAmountByStatusAndCreatedAtAfter(
                    PaymentStatus.COMPLETED, LocalDateTime.of(2020, 1, 1, 0, 0));
            return total != null ? total : BigDecimal.ZERO;
        } catch (Exception e) {
            log.error("Error getting total revenue: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    /**
     * Chuyển đổi tên tháng sang tiếng Việt
     */
    private String getVietnameseMonthName(int month) {
        String[] monthNames = {
            "", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
            "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
        };
        return month >= 1 && month <= 12 ? monthNames[month] : "Tháng " + month;
    }

    /**
     * So sánh doanh thu giữa các khoảng thời gian
     */
    public Map<String, Object> compareRevenue(String period, Integer currentYear, Integer currentMonth,
            Integer compareYear, Integer compareMonth) {
        Map<String, Object> result = new HashMap<>();

        try {
            // Lấy doanh thu kỳ hiện tại
            Map<String, Object> currentStats = getRevenueStats(period, currentYear, currentMonth);
            BigDecimal currentRevenue = (BigDecimal) currentStats.get("totalRevenue");

            // Lấy doanh thu kỳ so sánh
            Map<String, Object> compareStats = getRevenueStats(period, compareYear, compareMonth);
            BigDecimal compareRevenue = (BigDecimal) compareStats.get("totalRevenue");

            // Tính phần trăm thay đổi
            BigDecimal changePercent = BigDecimal.ZERO;
            if (compareRevenue.compareTo(BigDecimal.ZERO) > 0) {
                changePercent = currentRevenue.subtract(compareRevenue)
                        .divide(compareRevenue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            }

            result.put("currentPeriod", currentStats.get("period"));
            result.put("currentRevenue", currentRevenue);
            result.put("comparePeriod", compareStats.get("period"));
            result.put("compareRevenue", compareRevenue);
            result.put("changeAmount", currentRevenue.subtract(compareRevenue));
            result.put("changePercent", changePercent);
            result.put("isIncrease", currentRevenue.compareTo(compareRevenue) > 0);

        } catch (Exception e) {
            log.error("Error comparing revenue: {}", e.getMessage());
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Lấy hoạt động gần đây (real-time activities)
     */
    public List<Map<String, Object>> getRecentActivities(int limit) {
        List<Map<String, Object>> activities = new ArrayList<>();
        try { // Lấy các hoạt động trong 24 giờ gần đây
            LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
            List<Object[]> newUsers = entityManager
                    .createQuery(
                            "SELECT u.email, u.createdDate FROM UserDtls u WHERE u.createdDate >= :since ORDER BY u.createdDate DESC",
                            Object[].class)
                    .setParameter("since", last24Hours)
                    .setMaxResults(5)
                    .getResultList();

            for (Object[] user : newUsers) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "user");
                activity.put("message", "Người dùng mới đăng ký: " + user[0]);
                activity.put("time", formatTimeAgo((LocalDateTime) user[1]));
                activity.put("timestamp", user[1]);
                activities.add(activity);
            } // Lấy các consultation mới được tạo
            List<Object[]> newConsultations = entityManager
                    .createQuery(
                            "SELECT c.consultationId, c.createdAt, u.fullName FROM Consultation c JOIN UserDtls u ON c.consultant.id = u.id WHERE c.createdAt >= :since ORDER BY c.createdAt DESC",
                            Object[].class)
                    .setParameter("since", last24Hours)
                    .setMaxResults(5)
                    .getResultList();

            for (Object[] consultation : newConsultations) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "consultation");
                activity.put("message", "Buổi tư vấn mới được đặt với " + consultation[2]);
                activity.put("time", formatTimeAgo((LocalDateTime) consultation[1]));
                activity.put("timestamp", consultation[1]);
                activities.add(activity);
            } // Lấy các payment thành công gần đây
            List<Object[]> recentPayments = entityManager
                    .createQuery(
                            "SELECT p.amount, p.paidAt, p.serviceType FROM Payment p WHERE p.paymentStatus = :status AND p.paidAt >= :since ORDER BY p.paidAt DESC",
                            Object[].class)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .setParameter("since", last24Hours)
                    .setMaxResults(5)
                    .getResultList();
            for (Object[] payment : recentPayments) {
                Map<String, Object> activity = new HashMap<>();
                String serviceType = (String) payment[2];
                String serviceName;

                // Xử lý các loại service type
                switch (serviceType) {
                    case "STI_TEST":
                        serviceName = "dịch vụ STI";
                        break;
                    case "CONSULTATION":
                        serviceName = "tư vấn";
                        break;
                    case "STI_PACKAGE":
                        serviceName = "gói xét nghiệm STI";
                        break;
                    default:
                        serviceName = "dịch vụ";
                        break;
                }

                activity.put("type", "payment");
                activity.put("message", "Thanh toán thành công cho " + serviceName + " - "
                        + formatCurrency((BigDecimal) payment[0]));
                activity.put("time", formatTimeAgo((LocalDateTime) payment[1]));
                activity.put("timestamp", payment[1]);
                activities.add(activity);
            }// Lấy các STI test mới được tạo
            List<Object[]> newSTITests = entityManager
                    .createQuery(
                            "SELECT s.testId, s.createdAt FROM STITest s WHERE s.createdAt >= :since ORDER BY s.createdAt DESC",
                            Object[].class)
                    .setParameter("since", last24Hours)
                    .setMaxResults(5)
                    .getResultList();

            for (Object[] test : newSTITests) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "sti");
                activity.put("message", "Đặt xét nghiệm STI mới - ID: " + test[0]);
                activity.put("time", formatTimeAgo((LocalDateTime) test[1]));
                activity.put("timestamp", test[1]);
                activities.add(activity);
            }

            // Sắp xếp theo thời gian và lấy limit
            activities.sort((a, b) -> {
                LocalDateTime timeA = (LocalDateTime) a.get("timestamp");
                LocalDateTime timeB = (LocalDateTime) b.get("timestamp");
                return timeB.compareTo(timeA); // Mới nhất lên đầu
            });

            // Xóa timestamp khỏi response (chỉ dùng để sort)
            activities.forEach(activity -> activity.remove("timestamp"));

            // Giới hạn số lượng
            return activities.stream().limit(limit).collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting recent activities: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Format thời gian thành dạng "X phút trước"
     */
    private String formatTimeAgo(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(dateTime, now).toMinutes();

        if (minutes < 1) {
            return "Vừa xong";
        } else if (minutes < 60) {
            return minutes + " phút trước";
        } else if (minutes < 1440) // 24 hours
        {
            return (minutes / 60) + " giờ trước";
        } else {
            return (minutes / 1440) + " ngày trước";
        }
    }

    /**
     * Format currency cho activity message
     */
    private String formatCurrency(BigDecimal amount) {
        return new java.text.DecimalFormat("#,###").format(amount) + " VND";
    }

    /**
     * Lấy top consultants theo số lượng booking và rating
     */
    public List<Map<String, Object>> getTopConsultants(int limit) {
        List<Map<String, Object>> consultants = new ArrayList<>();

        try { // Query lấy consultant với số lượng consultation
            List<Object[]> consultantStats = entityManager
                    .createQuery(
                            "SELECT u.id, u.fullName, u.email, u.avatar, "
                            + "COUNT(c.consultationId) as bookingCount "
                            + "FROM UserDtls u "
                            + "LEFT JOIN Consultation c ON u.id = c.consultant.id "
                            + "WHERE u.role.roleName = 'CONSULTANT' "
                            + "AND (c.status IS NULL OR c.status != :canceledStatus) "
                            + "GROUP BY u.id, u.fullName, u.email, u.avatar "
                            + "ORDER BY COUNT(c.consultationId) DESC",
                            Object[].class)
                    .setParameter("canceledStatus", ConsultationStatus.CANCELED)
                    .setMaxResults(limit)
                    .getResultList();

            for (Object[] row : consultantStats) {
                Map<String, Object> consultant = new HashMap<>();
                Long consultantId = (Long) row[0];
                consultant.put("id", consultantId);
                consultant.put("fullName", row[1]);
                consultant.put("email", row[2]);
                consultant.put("avatar", row[3]);
                consultant.put("bookingCount", row[4]);

                // Lấy rating riêng biệt
                try {
                    List<Object[]> ratingResult = entityManager
                            .createQuery(
                                    "SELECT AVG(r.rating) FROM Rating r WHERE r.targetType = 'CONSULTANT' AND r.targetId = :consultantId",
                                    Object[].class)
                            .setParameter("consultantId", consultantId)
                            .getResultList();

                    Double avgRating = ratingResult.isEmpty() || ratingResult.get(0)[0] == null ? 0.0
                            : BigDecimal.valueOf(((Number) ratingResult.get(0)[0]).doubleValue())
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    consultant.put("avgRating", avgRating);
                } catch (Exception e) {
                    consultant.put("avgRating", 0.0);
                }

                consultants.add(consultant);
            }

        } catch (Exception e) {
            log.error("Error getting top consultants: {}", e.getMessage());
        }

        return consultants;
    }

    /**
     * Lấy top consultants theo số lượng booking và rating với filter thời gian
     */
    public List<Map<String, Object>> getTopConsultants(int limit, LocalDateTime startDate, LocalDateTime endDate) {
        List<Map<String, Object>> consultants = new ArrayList<>();

        try {
            // Query lấy consultant với số lượng consultation trong khoảng thời gian
            String query = "SELECT u.id, u.fullName, u.email, u.avatar, "
                    + "COUNT(c.consultationId) as bookingCount "
                    + "FROM UserDtls u "
                    + "LEFT JOIN Consultation c ON u.id = c.consultant.id "
                    + "WHERE u.role.roleName = 'CONSULTANT' "
                    + "AND (c.status IS NULL OR c.status != :canceledStatus) ";

            if (startDate != null && endDate != null) {
                query += "AND (c.createdAt IS NULL OR c.createdAt BETWEEN :startDate AND :endDate) ";
            }

            query += "GROUP BY u.id, u.fullName, u.email, u.avatar "
                    + "ORDER BY COUNT(c.consultationId) DESC";

            var queryObj = entityManager.createQuery(query, Object[].class)
                    .setParameter("canceledStatus", ConsultationStatus.CANCELED)
                    .setMaxResults(limit);

            if (startDate != null && endDate != null) {
                queryObj.setParameter("startDate", startDate)
                        .setParameter("endDate", endDate);
            }

            List<Object[]> consultantStats = queryObj.getResultList();

            for (Object[] row : consultantStats) {
                Map<String, Object> consultant = new HashMap<>();
                Long consultantId = (Long) row[0];
                consultant.put("id", consultantId);
                consultant.put("fullName", row[1]);
                consultant.put("email", row[2]);
                consultant.put("avatar", row[3]);
                consultant.put("bookingCount", row[4]);

                // Lấy rating riêng biệt
                try {
                    List<Object[]> ratingResult = entityManager
                            .createQuery(
                                    "SELECT AVG(r.rating) FROM Rating r WHERE r.targetType = 'CONSULTANT' AND r.targetId = :consultantId",
                                    Object[].class)
                            .setParameter("consultantId", consultantId)
                            .getResultList();

                    Double avgRating = ratingResult.isEmpty() || ratingResult.get(0)[0] == null ? 0.0
                            : BigDecimal.valueOf(((Number) ratingResult.get(0)[0]).doubleValue())
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    consultant.put("avgRating", avgRating);
                } catch (Exception e) {
                    consultant.put("avgRating", 0.0);
                }

                consultants.add(consultant);
            }

        } catch (Exception e) {
            log.error("Error getting top consultants: {}", e.getMessage());
        }

        return consultants;
    }

    /**
     * Lấy top STI Services theo số lượng booking CHỈ tính các service booking
     * lẻ (không thuộc package)
     */
    public List<Map<String, Object>> getTopSTIServices(int limit) {
        List<Map<String, Object>> services = new ArrayList<>();

        try {
            List<Object[]> serviceStats = entityManager
                    .createQuery("SELECT s.serviceId, s.name, s.price, "
                            + "COUNT(DISTINCT st.testId) as bookingCount "
                            + "FROM STIService s "
                            + "LEFT JOIN STITest st ON s.serviceId = st.stiService.serviceId "
                            + "AND st.stiPackage IS NULL "
                            + "AND (st.status != :canceledStatus OR st.status IS NULL) "
                            + "WHERE s.isActive = true " + "GROUP BY s.serviceId, s.name, s.price "
                            + "ORDER BY COUNT(DISTINCT st.testId) DESC",
                            Object[].class)
                    .setParameter("canceledStatus", TestStatus.CANCELED)
                    .setMaxResults(limit)
                    .getResultList();
            for (Object[] row : serviceStats) {
                Map<String, Object> service = new HashMap<>();
                Long serviceId = (Long) row[0];
                service.put("serviceId", serviceId);
                service.put("serviceName", row[1]);
                service.put("price", row[2]);
                service.put("bookingCount", row[3]);

                // Lấy rating riêng biệt cho STI Service
                try {
                    List<Object[]> ratingResult = entityManager
                            .createQuery(
                                    "SELECT AVG(r.rating) FROM Rating r WHERE r.targetType = 'STI_SERVICE' AND r.targetId = :serviceId",
                                    Object[].class)
                            .setParameter("serviceId", serviceId)
                            .getResultList();

                    Double avgRating = ratingResult.isEmpty() || ratingResult.get(0)[0] == null ? 0.0
                            : BigDecimal.valueOf(((Number) ratingResult.get(0)[0]).doubleValue())
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    service.put("avgRating", avgRating);
                } catch (Exception e) {
                    service.put("avgRating", 0.0);
                }

                services.add(service);
            }

        } catch (Exception e) {
            log.error("Error getting top STI services: {}", e.getMessage());
        }

        return services;
    }

    /**
     * Lấy top STI Packages theo số lượng booking CHỈ tính các booking package
     * (không tính service lẻ)
     */
    public List<Map<String, Object>> getTopSTIPackages(int limit) {
        List<Map<String, Object>> packages = new ArrayList<>();

        try {
            List<Object[]> packageStats = entityManager
                    .createQuery("SELECT p.packageId, p.packageName, p.packagePrice, "
                            + "COUNT(DISTINCT st.testId) as bookingCount "
                            + "FROM STIPackage p "
                            + "LEFT JOIN STITest st ON p.packageId = st.stiPackage.packageId "
                            + "AND st.stiService IS NULL "
                            + "AND (st.status != :canceledStatus OR st.status IS NULL) "
                            + "WHERE p.isActive = true " + "GROUP BY p.packageId, p.packageName, p.packagePrice "
                            + "ORDER BY COUNT(DISTINCT st.testId) DESC",
                            Object[].class)
                    .setParameter("canceledStatus", TestStatus.CANCELED)
                    .setMaxResults(limit)
                    .getResultList();
            for (Object[] row : packageStats) {
                Map<String, Object> packageInfo = new HashMap<>();
                Long packageId = (Long) row[0];
                packageInfo.put("packageId", packageId);
                packageInfo.put("packageName", row[1]);
                packageInfo.put("totalPrice", row[2]);
                packageInfo.put("bookingCount", row[3]);

                // Lấy rating riêng biệt cho STI Package
                try {
                    List<Object[]> ratingResult = entityManager
                            .createQuery(
                                    "SELECT AVG(r.rating) FROM Rating r WHERE r.targetType = 'STI_PACKAGE' AND r.targetId = :packageId",
                                    Object[].class)
                            .setParameter("packageId", packageId)
                            .getResultList();

                    Double avgRating = ratingResult.isEmpty() || ratingResult.get(0)[0] == null ? 0.0
                            : BigDecimal.valueOf(((Number) ratingResult.get(0)[0]).doubleValue())
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    packageInfo.put("avgRating", avgRating);
                } catch (Exception e) {
                    packageInfo.put("avgRating", 0.0);
                }
                packages.add(packageInfo);
            }

        } catch (Exception e) {
            log.error("Error getting top STI packages: {}", e.getMessage());
        }

        return packages;
    }

    /**
     * Lấy top STI Services theo số lượng booking với filter thời gian CHỈ tính
     * các service booking lẻ (không thuộc package)
     */
    public List<Map<String, Object>> getTopSTIServices(int limit, LocalDateTime startDate, LocalDateTime endDate) {
        List<Map<String, Object>> services = new ArrayList<>();

        try {
            String query = "SELECT s.serviceId, s.name, s.price, "
                    + "COUNT(DISTINCT st.testId) as bookingCount "
                    + "FROM STIService s "
                    + "LEFT JOIN STITest st ON s.serviceId = st.stiService.serviceId "
                    + "AND st.stiPackage IS NULL "
                    + "AND (st.status != :canceledStatus OR st.status IS NULL) "
                    + "WHERE s.isActive = true ";

            if (startDate != null && endDate != null) {
                query += "AND (st.createdAt IS NULL OR st.createdAt BETWEEN :startDate AND :endDate) ";
            }
            query += "GROUP BY s.serviceId, s.name, s.price "
                    + "ORDER BY COUNT(DISTINCT st.testId) DESC";

            var queryObj = entityManager.createQuery(query, Object[].class)
                    .setParameter("canceledStatus", TestStatus.CANCELED)
                    .setMaxResults(limit);

            if (startDate != null && endDate != null) {
                queryObj.setParameter("startDate", startDate)
                        .setParameter("endDate", endDate);
            }

            List<Object[]> serviceStats = queryObj.getResultList();
            log.info("DEBUG - Found {} STI services", serviceStats.size());
            for (Object[] row : serviceStats) {
                Map<String, Object> service = new HashMap<>();
                Long serviceId = (Long) row[0];
                service.put("serviceId", serviceId);
                service.put("serviceName", row[1]);
                service.put("price", row[2]);
                service.put("bookingCount", row[3]);

                // Lấy rating riêng biệt để tránh ảnh hưởng đến COUNT
                try {
                    List<Object[]> ratingResult = entityManager
                            .createQuery(
                                    "SELECT AVG(r.rating) FROM Rating r WHERE r.targetType = 'STI_SERVICE' AND r.targetId = :serviceId",
                                    Object[].class)
                            .setParameter("serviceId", serviceId)
                            .getResultList();

                    Double avgRating = ratingResult.isEmpty() || ratingResult.get(0)[0] == null ? 0.0
                            : BigDecimal.valueOf(((Number) ratingResult.get(0)[0]).doubleValue())
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    service.put("avgRating", avgRating);
                } catch (Exception e) {
                    service.put("avgRating", 0.0);
                }
                services.add(service);
            }

        } catch (Exception e) {
            log.error("Error getting top STI services: {}", e.getMessage());
        }

        return services;
    }

    /**
     * Lấy top STI Packages theo số lượng booking với filter thời gian CHỈ tính
     * các booking package (không tính service lẻ)
     */
    public List<Map<String, Object>> getTopSTIPackages(int limit, LocalDateTime startDate, LocalDateTime endDate) {
        List<Map<String, Object>> packages = new ArrayList<>();

        try {
            String query = "SELECT p.packageId, p.packageName, p.packagePrice, "
                    + "COUNT(DISTINCT st.testId) as bookingCount "
                    + "FROM STIPackage p "
                    + "LEFT JOIN STITest st ON p.packageId = st.stiPackage.packageId "
                    + "AND st.stiService IS NULL "
                    + "AND (st.status != :canceledStatus OR st.status IS NULL) "
                    + "WHERE p.isActive = true ";

            if (startDate != null && endDate != null) {
                query += "AND (st.createdAt IS NULL OR st.createdAt BETWEEN :startDate AND :endDate) ";
            }
            query += "GROUP BY p.packageId, p.packageName, p.packagePrice "
                    + "ORDER BY COUNT(DISTINCT st.testId) DESC";

            var queryObj = entityManager.createQuery(query, Object[].class)
                    .setParameter("canceledStatus", TestStatus.CANCELED)
                    .setMaxResults(limit);

            if (startDate != null && endDate != null) {
                queryObj.setParameter("startDate", startDate)
                        .setParameter("endDate", endDate);
            }

            List<Object[]> packageStats = queryObj.getResultList();
            for (Object[] row : packageStats) {
                Map<String, Object> packageInfo = new HashMap<>();
                Long packageId = (Long) row[0];
                packageInfo.put("packageId", packageId);
                packageInfo.put("packageName", row[1]);
                packageInfo.put("totalPrice", row[2]);
                packageInfo.put("bookingCount", row[3]);

                // Lấy rating riêng biệt để tránh ảnh hưởng đến COUNT
                try {
                    List<Object[]> ratingResult = entityManager
                            .createQuery(
                                    "SELECT AVG(r.rating) FROM Rating r WHERE r.targetType = 'STI_PACKAGE' AND r.targetId = :packageId",
                                    Object[].class)
                            .setParameter("packageId", packageId)
                            .getResultList();

                    Double avgRating = ratingResult.isEmpty() || ratingResult.get(0)[0] == null ? 0.0
                            : BigDecimal.valueOf(((Number) ratingResult.get(0)[0]).doubleValue())
                                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
                    packageInfo.put("avgRating", avgRating);
                } catch (Exception e) {
                    packageInfo.put("avgRating", 0.0);
                }
                packages.add(packageInfo);
            }

        } catch (Exception e) {
            log.error("Error getting top STI packages: {}", e.getMessage());
        }

        return packages;
    }

    /**
     * Lấy phân bổ doanh thu theo loại dịch vụ
     */
    public List<Map<String, Object>> getRevenueDistribution() {
        List<Map<String, Object>> distribution = new ArrayList<>();
        try {
            // Doanh thu từ STI Services (service lẻ) - join với STITest
            List<Object[]> stiServiceRevenue = entityManager
                    .createQuery(
                            "SELECT SUM(p.amount) as totalRevenue "
                            + "FROM Payment p "
                            + "JOIN STITest st ON p.serviceId = st.testId "
                            + "WHERE p.paymentStatus = :status AND p.serviceType = 'STI' "
                            + "AND st.stiService IS NOT NULL AND st.stiPackage IS NULL",
                            Object[].class)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getResultList();

            // Doanh thu từ STI Packages - join với STITest
            List<Object[]> stiPackageRevenue = entityManager
                    .createQuery(
                            "SELECT SUM(p.amount) as totalRevenue "
                            + "FROM Payment p "
                            + "JOIN STITest st ON p.serviceId = st.testId "
                            + "WHERE p.paymentStatus = :status AND p.serviceType = 'STI' "
                            + "AND st.stiPackage IS NOT NULL",
                            Object[].class)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getResultList();

            // Doanh thu từ Consultations (nếu có serviceType CONSULTATION)
            List<Object[]> consultationRevenue = entityManager
                    .createQuery(
                            "SELECT SUM(p.amount) as totalRevenue "
                            + "FROM Payment p "
                            + "WHERE p.paymentStatus = :status AND p.serviceType = 'CONSULTATION'",
                            Object[].class)
                    .setParameter("status", PaymentStatus.COMPLETED).getResultList();

            // Thêm STI Service nếu có doanh thu
            if (!stiServiceRevenue.isEmpty() && stiServiceRevenue.get(0) != null) {
                Object[] row = stiServiceRevenue.get(0);
                BigDecimal amount = (BigDecimal) row[0];
                if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", "STI Service");
                    item.put("revenue", amount.doubleValue());
                    item.put("color", "#3b82f6"); // Blue
                    distribution.add(item);
                }
            }

            // Thêm STI Package nếu có doanh thu
            if (!stiPackageRevenue.isEmpty() && stiPackageRevenue.get(0) != null) {
                Object[] row = stiPackageRevenue.get(0);
                BigDecimal amount = (BigDecimal) row[0];
                if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", "STI Package");
                    item.put("revenue", amount.doubleValue());
                    item.put("color", "#10b981"); // Green
                    distribution.add(item);
                }
            }

            // Thêm Consultation nếu có doanh thu
            if (!consultationRevenue.isEmpty() && consultationRevenue.get(0) != null) {
                Object[] row = consultationRevenue.get(0);
                BigDecimal amount = (BigDecimal) row[0];
                if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", "Consultation");
                    item.put("revenue", amount.doubleValue());
                    item.put("color", "#f59e0b"); // Orange
                    distribution.add(item);
                }
            }

            // Kiểm tra các service types khác (ngoài STI và CONSULTATION)
            List<Object[]> otherServiceTypes = entityManager
                    .createQuery(
                            "SELECT p.serviceType, SUM(p.amount) "
                            + "FROM Payment p "
                            + "WHERE p.paymentStatus = :status "
                            + "AND p.serviceType NOT IN ('STI', 'CONSULTATION') "
                            + "GROUP BY p.serviceType",
                            Object[].class)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getResultList();

            // Thêm các service types khác với màu purple
            for (Object[] row : otherServiceTypes) {
                String serviceType = (String) row[0];
                BigDecimal amount = (BigDecimal) row[1];
                if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", serviceType);
                    item.put("revenue", amount.doubleValue());
                    item.put("color", "#8b5cf6"); // Purple
                    distribution.add(item);
                }
            }

            // Nếu không có dữ liệu, tạo mock data
            if (distribution.isEmpty()) {
                log.warn("No revenue data found, using mock data");
                distribution.add(Map.of("name", "STI Service", "revenue", 5000000.0, "color", "#3b82f6"));
                distribution.add(Map.of("name", "STI Package", "revenue", 3000000.0, "color", "#10b981"));
                distribution.add(Map.of("name", "Consultation", "revenue", 2000000.0, "color", "#f59e0b"));
            }

        } catch (Exception e) {
            log.error("Error getting revenue distribution: {}", e.getMessage(), e);
            // Return mock data on error
            distribution.clear();
            distribution.add(Map.of("name", "STI Service", "revenue", 5000000.0, "color", "#3b82f6"));
            distribution.add(Map.of("name", "STI Package", "revenue", 3000000.0, "color", "#10b981"));
            distribution.add(Map.of("name", "Consultation", "revenue", 2000000.0, "color", "#f59e0b"));
        }

        return distribution;
    }

    /**
     * Thêm các KPI kinh doanh quan trọng vào thống kê tổng quan
     */
    private void addBusinessKPIs(Map<String, Object> stats, BigDecimal totalRevenue) {
        try {
            // 1. Average Order Value (AOV)
            BigDecimal averageOrderValue = calculateAverageOrderValue();
            stats.put("averageOrderValue", averageOrderValue);

            // 2. Revenue Per User (RPU)
            BigDecimal revenuePerUser = calculateRevenuePerUser(totalRevenue);
            stats.put("revenuePerUser", revenuePerUser);

            // 3. Growth Rate (tháng này so với tháng trước)
            Map<String, BigDecimal> growthRates = calculateGrowthRates();
            stats.put("revenueGrowthRate", growthRates.get("revenue"));
            stats.put("userGrowthRate", growthRates.get("users"));
            stats.put("orderGrowthRate", growthRates.get("orders"));            // 4. Customer Retention Rate (30 ngày)
            BigDecimal retentionRate = calculateCustomerRetentionRate();
            stats.put("customerRetentionRate", retentionRate);

            log.info("Business KPIs calculated successfully");
        } catch (Exception e) {
            log.error("Error calculating business KPIs: {}", e.getMessage());
            // Set default values nếu có lỗi
            stats.put("averageOrderValue", BigDecimal.ZERO);
            stats.put("revenuePerUser", BigDecimal.ZERO);
            stats.put("revenueGrowthRate", BigDecimal.ZERO);
            stats.put("userGrowthRate", BigDecimal.ZERO);
            stats.put("orderGrowthRate", BigDecimal.ZERO);
            stats.put("customerRetentionRate", BigDecimal.ZERO);
        }
    }

    /**
     * Tính Average Order Value
     */
    private BigDecimal calculateAverageOrderValue() {
        try {
            Object[] result = (Object[]) entityManager
                    .createQuery("SELECT COUNT(p), SUM(p.amount) FROM Payment p WHERE p.paymentStatus = :status")
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getSingleResult();

            Long totalOrders = (Long) result[0];
            BigDecimal totalAmount = (BigDecimal) result[1];

            if (totalOrders > 0 && totalAmount != null) {
                return totalAmount.divide(new BigDecimal(totalOrders), 2, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            log.error("Error calculating AOV: {}", e.getMessage());
        }
        return BigDecimal.ZERO;
    }

    /**
     * Tính Revenue Per User
     */
    private BigDecimal calculateRevenuePerUser(BigDecimal totalRevenue) {
        try {
            Long totalUsers = userRepository.count();
            if (totalUsers > 0 && totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
                return totalRevenue.divide(new BigDecimal(totalUsers), 2, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            log.error("Error calculating RPU: {}", e.getMessage());
        }
        return BigDecimal.ZERO;
    }

    /**
     * Tính Growth Rates (tháng này vs tháng trước)
     */
    private Map<String, BigDecimal> calculateGrowthRates() {
        Map<String, BigDecimal> growthRates = new HashMap<>();

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);
            LocalDateTime endOfLastMonth = startOfThisMonth.minusDays(1);

            // Revenue Growth
            BigDecimal thisMonthRevenue = getRevenueForPeriod(startOfThisMonth, now);
            BigDecimal lastMonthRevenue = getRevenueForPeriod(startOfLastMonth, endOfLastMonth);
            growthRates.put("revenue", calculateGrowthRate(thisMonthRevenue, lastMonthRevenue));

            // User Growth
            Long thisMonthUsers = getUserCountForPeriod(startOfThisMonth, now);
            Long lastMonthUsers = getUserCountForPeriod(startOfLastMonth, endOfLastMonth);
            growthRates.put("users", calculateGrowthRate(new BigDecimal(thisMonthUsers), new BigDecimal(lastMonthUsers)));

            // Order Growth
            Long thisMonthOrders = getOrderCountForPeriod(startOfThisMonth, now);
            Long lastMonthOrders = getOrderCountForPeriod(startOfLastMonth, endOfLastMonth);
            growthRates.put("orders", calculateGrowthRate(new BigDecimal(thisMonthOrders), new BigDecimal(lastMonthOrders)));

        } catch (Exception e) {
            log.error("Error calculating growth rates: {}", e.getMessage());
            growthRates.put("revenue", BigDecimal.ZERO);
            growthRates.put("users", BigDecimal.ZERO);
            growthRates.put("orders", BigDecimal.ZERO);
        }

        return growthRates;
    }

    /**
     * Helper method để tính growth rate
     */
    private BigDecimal calculateGrowthRate(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? new BigDecimal(100) : BigDecimal.ZERO;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Tính Customer Retention Rate (30 ngày)
     */
    private BigDecimal calculateCustomerRetentionRate() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime thirtyDaysAgo = now.minusDays(30);
            LocalDateTime sixtyDaysAgo = now.minusDays(60);

            // Khách hàng active 30-60 ngày trước
            List<Long> customersFromPreviousPeriod = entityManager
                    .createQuery("SELECT DISTINCT p.user.id FROM Payment p WHERE p.paidAt BETWEEN :start AND :end AND p.paymentStatus = :status", Long.class)
                    .setParameter("start", sixtyDaysAgo)
                    .setParameter("end", thirtyDaysAgo)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getResultList();

            if (customersFromPreviousPeriod.isEmpty()) {
                return BigDecimal.ZERO;
            }

            // Trong số đó, bao nhiều người quay lại trong 30 ngày gần đây
            Long returningCustomers = entityManager
                    .createQuery("SELECT COUNT(DISTINCT p.user.id) FROM Payment p WHERE p.user.id IN :customerIds AND p.paidAt >= :start AND p.paymentStatus = :status", Long.class)
                    .setParameter("customerIds", customersFromPreviousPeriod)
                    .setParameter("start", thirtyDaysAgo)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getSingleResult();

            return new BigDecimal(returningCustomers)
                    .divide(new BigDecimal(customersFromPreviousPeriod.size()), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal(100))
                    .setScale(2, RoundingMode.HALF_UP);

        } catch (Exception e) {
            log.error("Error calculating retention rate: {}", e.getMessage());
        }
        return BigDecimal.ZERO;
    }

    /**
     * Helper methods cho growth rate calculation
     */
    private BigDecimal getRevenueForPeriod(LocalDateTime start, LocalDateTime end) {
        try {
            BigDecimal revenue = (BigDecimal) entityManager
                    .createQuery("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paidAt BETWEEN :start AND :end AND p.paymentStatus = :status")
                    .setParameter("start", start)
                    .setParameter("end", end)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getSingleResult();
            return revenue != null ? revenue : BigDecimal.ZERO;
        } catch (Exception e) {
            log.error("Error getting revenue for period: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    private Long getUserCountForPeriod(LocalDateTime start, LocalDateTime end) {
        try {
            return (Long) entityManager
                    .createQuery("SELECT COUNT(u) FROM UserDtls u WHERE u.createdAt BETWEEN :start AND :end")
                    .setParameter("start", start)
                    .setParameter("end", end)
                    .getSingleResult();
        } catch (Exception e) {
            log.error("Error getting user count for period: {}", e.getMessage());
            return 0L;
        }
    }

    private Long getOrderCountForPeriod(LocalDateTime start, LocalDateTime end) {
        try {
            return (Long) entityManager
                    .createQuery("SELECT COUNT(p) FROM Payment p WHERE p.paidAt BETWEEN :start AND :end AND p.paymentStatus = :status")
                    .setParameter("start", start)
                    .setParameter("end", end)
                    .setParameter("status", PaymentStatus.COMPLETED)
                    .getSingleResult();
        } catch (Exception e) {
            log.error("Error getting order count for period: {}", e.getMessage());
            return 0L;
        }
    }
}
