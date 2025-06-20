package com.healapp.service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.healapp.dto.ApiResponse;
import com.healapp.mcp.dto.ChatResponse;
import com.healapp.mcp.service.MCPService;

@Service
public class ContentModerationService {

    private static final Logger logger = LoggerFactory.getLogger(ContentModerationService.class);

    @Autowired
    private MCPService mcpService;

    @Value("${healapp.moderation.enabled:true}")
    private boolean enabled;

    @Value("${healapp.moderation.cache.enabled:true}")
    private boolean cacheEnabled;

    @Value("${healapp.moderation.cache.ttl:3600}")
    private long cacheTtlSeconds;

    // Cache lưu trữ các kết quả kiểm duyệt để tránh gọi AI liên tục
    private final Map<String, ModerationCacheEntry> moderationCache = new ConcurrentHashMap<>();

    // Cache lưu trữ các câu hỏi đã bị chặn để theo dõi
    private final Map<String, ModeratedQuestion> blockedQuestionsStats = new ConcurrentHashMap<>();

    // Kiểm tra nội dung câu hỏi có phù hợp không
    public boolean isAppropriateContent(String question) {
        // Nếu tính năng kiểm duyệt bị tắt
        if (!enabled) {
            return true;
        }

        if (question == null || question.trim().isEmpty()) {
            return true;
        }

        String cleanedQuestion = question.trim();
        String questionHash = String.valueOf(cleanedQuestion.hashCode());

        // Kiểm tra cache trước khi gọi AI
        if (cacheEnabled) {
            ModerationCacheEntry cachedResult = moderationCache.get(questionHash);
            if (cachedResult != null && !isExpired(cachedResult.getTimestamp())) {
                logger.debug("Using cached moderation result for question hash {}", questionHash);

                if (!cachedResult.isAppropriate()) {
                    recordBlockedQuestion(questionHash, cleanedQuestion, cachedResult.getReason());
                }

                return cachedResult.isAppropriate();
            }
        }

        // Gọi AI để kiểm duyệt nội dung
        ModerationResult result = moderateContentWithAI(cleanedQuestion);

        // Lưu kết quả vào cache
        if (cacheEnabled) {
            moderationCache.put(questionHash,
                    new ModerationCacheEntry(result.isAppropriate(), result.getReason(), System.currentTimeMillis()));

            // Dọn cache nếu quá lớn
            if (moderationCache.size() > 10000) {
                cleanupCache();
            }
        }

        // Ghi lại thống kê nếu bị chặn
        if (!result.isAppropriate()) {
            recordBlockedQuestion(questionHash, cleanedQuestion, result.getReason());
        }

        return result.isAppropriate();
    }

    private ModerationResult moderateContentWithAI(String question) {
        try {
            // Tạo prompt để AI kiểm duyệt nội dung
            String moderationPrompt = createModerationPrompt(question);

            // Gọi AI để phân tích
            ApiResponse<ChatResponse> response = mcpService.generateResponse(question, moderationPrompt);

            if (!response.isSuccess() || response.getData() == null) {
                logger.error("Lỗi khi gọi AI kiểm duyệt: {}", response.getMessage());
                // Mặc định cho phép nếu gặp lỗi
                return new ModerationResult(true, "error");
            }

            String aiResponse = response.getData().getText().trim().toUpperCase();
            logger.debug("AI moderation response: {}", aiResponse);

            // Phân tích phản hồi của AI
            if (aiResponse.contains("INAPPROPRIATE")) {
                String reason = extractReasonFromAIResponse(aiResponse);
                logger.info("AI phát hiện nội dung không phù hợp: {} - Lý do: {}", question, reason);
                return new ModerationResult(false, reason);
            } else {
                return new ModerationResult(true, "appropriate");
            }

        } catch (Exception e) {
            logger.error("Lỗi không mong đợi khi kiểm duyệt nội dung: {}", e.getMessage(), e);
            // Mặc định cho phép nếu gặp lỗi
            return new ModerationResult(true, "error");
        }
    }
    // Tạo prompt cho AI để kiểm duyệt nội dung
    private String createModerationPrompt(String question) {
        return "Bạn là hệ thống kiểm duyệt nội dung cho ứng dụng HealApp - một nền tảng chăm sóc sức khỏe.\n\n" +
                "Nhiệm vụ của bạn là đánh giá xem câu hỏi của người dùng có phù hợp với phạm vi của HealApp không.\n\n"
                +
                "HealApp CHỈ hỗ trợ các chủ đề sau:\n" +
                "1. Các vấn đề sức khỏe thể chất và tinh thần\n" +
                "2. Y tế và chăm sóc sức khỏe\n" +
                "3. Dinh dưỡng và lối sống lành mạnh\n" +
                "4. Hướng dẫn sử dụng nền tảng HealApp\n" +
                "5. Đăng ký, đăng nhập, quản lý tài khoản\n" +
                "6. Đặt lịch tư vấn với bác sĩ/chuyên gia\n" +
                "7. Cách đặt và trả lời câu hỏi trên HealApp\n\n" +

                "HealApp KHÔNG hỗ trợ các chủ đề sau:\n" +
                "1. Nấu ăn, công thức nấu ăn không liên quan đến sức khỏe\n" +
                "2. Giải trí (phim, nhạc, game, thể thao...)\n" +
                "3. Tài chính, đầu tư, tiền điện tử\n" +
                "4. Chính trị, tôn giáo\n" +
                "5. Công nghệ, lập trình không liên quan đến sức khỏe\n" +
                "6. Du lịch, đặt phòng khách sạn\n" +
                "7. Giáo dục không liên quan đến y tế/sức khỏe\n" +
                "8. Bất kỳ nội dung có hại, bạo lực, người lớn\n\n" +

                "Câu hỏi: \"" + question + "\"\n\n" +

                "Hãy phân tích câu hỏi này và trả lời theo định dạng sau:\n" +
                "APPROPRIATE hoặc INAPPROPRIATE|LÝ DO\n\n" +
                "Ví dụ: \"INAPPROPRIATE|COOKING\" cho câu hỏi về nấu ăn.\n" +
                "Ví dụ: \"APPROPRIATE|HEALTH\" cho câu hỏi về sức khỏe.\n\n" +

                "Các LÝ DO có thể là: HEALTH, SYSTEM, OFF_TOPIC, COOKING, ENTERTAINMENT, FINANCE, POLITICS, RELIGION, TECH, TRAVEL, EDUCATION, HARMFUL, OTHER";
    }

    // Trích xuất lý do từ phản hồi của AI
    private String extractReasonFromAIResponse(String aiResponse) {
        if (aiResponse.contains("|")) {
            String[] parts = aiResponse.split("\\|");
            if (parts.length > 1) {
                return parts[1].trim();
            }
        }
        return "UNKNOWN";
    }

    // Ghi lại thông tin câu hỏi bị chặn
    private void recordBlockedQuestion(String questionHash, String question, String reason) {
        ModeratedQuestion stats = blockedQuestionsStats.get(questionHash);

        if (stats == null) {
            stats = new ModeratedQuestion(question, reason, 1, System.currentTimeMillis());
        } else {
            stats.incrementCount();
            stats.setTimestamp(System.currentTimeMillis());
        }

        blockedQuestionsStats.put(questionHash, stats);
        logger.info("Câu hỏi bị chặn: {} (Lý do: {}, Số lần: {})",
                question, reason, stats.getCount());
    }

    // Kiểm tra xem cache entry có hết hạn chưa
    private boolean isExpired(long timestamp) {
        return System.currentTimeMillis() - timestamp > TimeUnit.SECONDS.toMillis(cacheTtlSeconds);
    }

    // Dọn dẹp cache
    private void cleanupCache() {
        long now = System.currentTimeMillis();
        moderationCache.entrySet()
                .removeIf(entry -> now - entry.getValue().getTimestamp() > TimeUnit.SECONDS.toMillis(cacheTtlSeconds));
    }

    // Lấy thống kê về các câu hỏi bị chặn
    public Map<String, ModeratedQuestion> getBlockedQuestionsStats() {
        return new HashMap<>(blockedQuestionsStats);
    }

    public void clearCache() {
        moderationCache.clear();
        logger.info("Đã xóa cache kiểm duyệt");
    }

    public String getSafeResponse() {
        return "Xin chào! Tôi là trợ lý AI của HealApp, tôi chỉ có thể trả lời các câu hỏi liên quan đến:\n\n" +
                "✅ **Các vấn đề sức khỏe và y tế**\n" +
                "✅ **Dinh dưỡng và lối sống lành mạnh**\n" +
                "✅ **Cách sử dụng nền tảng HealApp**\n\n" +
                "Câu hỏi của bạn nằm ngoài phạm vi hỗ trợ của tôi. Vui lòng hỏi về các chủ đề liên quan đến sức khỏe " +
                "hoặc cách sử dụng HealApp để tôi có thể hỗ trợ bạn tốt nhất.";
    }

    // Lớp đại diện cho kết quả kiểm duyệt
    private static class ModerationResult {
        private final boolean appropriate;
        private final String reason;

        public ModerationResult(boolean appropriate, String reason) {
            this.appropriate = appropriate;
            this.reason = reason;
        }

        public boolean isAppropriate() {
            return appropriate;
        }

        public String getReason() {
            return reason;
        }
    }

    // Lớp đại diện cho mục lưu cache kết quả kiểm duyệt
    private static class ModerationCacheEntry {
        private final boolean appropriate;
        private final String reason;
        private final long timestamp;

        public ModerationCacheEntry(boolean appropriate, String reason, long timestamp) {
            this.appropriate = appropriate;
            this.reason = reason;
            this.timestamp = timestamp;
        }

        public boolean isAppropriate() {
            return appropriate;
        }

        public String getReason() {
            return reason;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }

    // Lớp đại diện cho thông tin câu hỏi bị kiểm duyệt
    public static class ModeratedQuestion {
        private final String question;
        private final String reason;
        private int count;
        private long timestamp;

        public ModeratedQuestion(String question, String reason, int count, long timestamp) {
            this.question = question;
            this.reason = reason;
            this.count = count;
            this.timestamp = timestamp;
        }

        public void incrementCount() {
            this.count++;
        }

        public String getQuestion() {
            return question;
        }

        public String getReason() {
            return reason;
        }

        public int getCount() {
            return count;
        }

        public long getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}