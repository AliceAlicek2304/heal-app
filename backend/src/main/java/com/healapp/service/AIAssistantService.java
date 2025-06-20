package com.healapp.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.healapp.dto.AIAssistantRequest;
import com.healapp.dto.AIAssistantResponse;
import com.healapp.dto.ApiResponse;
import com.healapp.dto.ChatHistoryResponse;
import com.healapp.dto.ChatMessage;
import com.healapp.mcp.dto.ChatResponse;
import com.healapp.mcp.service.MCPService;

@Service
public class AIAssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AIAssistantService.class);

    @Autowired
    private MCPService mcpService;

    @Autowired
    private AIKnowledgeService knowledgeService;

    @Autowired
    private ContentModerationService contentModerationService;

    @Value("${healapp.assistant.max-history:10}")
    private int maxHistoryLength;

    // Cache lưu trữ lịch sử chat
    private final Map<Long, List<ChatMessage>> chatHistory = new ConcurrentHashMap<>();

    /**
     * Xử lý câu hỏi từ người dùng và trả về câu trả lời phù hợp
     * 
     * @param request Yêu cầu từ người dùng
     * @param userId  ID của người dùng
     * @return Câu trả lời từ AI
     */
    public ApiResponse<AIAssistantResponse> chatSmart(AIAssistantRequest request, Long userId) {
        try {
            // Xác thực đầu vào
            if (request == null || request.getUserQuestion() == null || request.getUserQuestion().trim().isEmpty()) {
                return ApiResponse.error("Question cannot be left blank");
            }

            String question = request.getUserQuestion().trim();
            logger.info("Get questions from users [{}]: {}", userId, question);

            // Kiểm duyệt nội dung bằng AI
            long startTime = System.currentTimeMillis();
            boolean isAppropriate = contentModerationService.isAppropriateContent(question);
            long moderationTime = System.currentTimeMillis() - startTime;

            logger.info("Censorship results [{}ms]: {}", moderationTime, isAppropriate ? "Suitable" : "Not suitable");

            // Nếu nội dung không phù hợp, trả về thông báo an toàn
            if (!isAppropriate) {
                AIAssistantResponse response = createSafeResponse(request.getUserQuestion());

                // Lưu trò chuyện vào lịch sử
                if (userId != null) {
                    addToHistory(userId, request.getUserQuestion(), response.getAnswer());
                }

                return ApiResponse.success("Question is out of HealApp's scope", response);
            }

            // Xử lý câu hỏi hợp lệ
            String customPrompt = getEnhancedPrompt(question);

            // Gọi MCP service để lấy phản hồi từ AI
            ApiResponse<ChatResponse> mcpResponse = mcpService.generateResponse(question, customPrompt);

            if (!mcpResponse.isSuccess()) {
                return ApiResponse.error("Cannot create response: " + mcpResponse.getMessage());
            }

            // Tạo phản hồi từ kết quả AI
            ChatResponse chatResponse = mcpResponse.getData();
            AIAssistantResponse response = new AIAssistantResponse();
            response.setQuestion(request.getUserQuestion());
            response.setAnswer(chatResponse.getText());
            response.setModel(chatResponse.getModel());
            response.setResponseTimeMs(chatResponse.getProcessingTimeMs());

            // Lưu trò chuyện vào lịch sử
            if (userId != null) {
                addToHistory(userId, request.getUserQuestion(), chatResponse.getText());
            }

            return ApiResponse.success("Response has been successfully created", response);

        } catch (Exception e) {
            logger.error("Error processing question: {}", e.getMessage(), e);
            return ApiResponse.error("Cannot create response: " + e.getMessage());
        }
    }

    /**
     * Tạo phản hồi an toàn cho câu hỏi không phù hợp
     */
    private AIAssistantResponse createSafeResponse(String question) {
        AIAssistantResponse response = new AIAssistantResponse();
        response.setQuestion(question);
        response.setAnswer(contentModerationService.getSafeResponse());
        response.setModel("content-filter");
        response.setResponseTimeMs(0);
        return response;
    }

    /**
     * Lấy prompt nâng cao dựa trên nội dung câu hỏi
     */
    private String getEnhancedPrompt(String question) {
        // Tạo prompt phù hợp với loại câu hỏi
        if (isSystemQuery(question)) {
            return knowledgeService.createEnhancedSystemPrompt(question);
        } else {
            return createHealthPrompt();
        }
    }

    /**
     * Tạo prompt cho câu hỏi liên quan đến sức khỏe
     */
    private String createHealthPrompt() {
        return "Bạn là trợ lý chăm sóc sức khỏe của HealApp, một nền tảng y tế trực tuyến. " +
                "Hãy cung cấp thông tin và lời khuyên hữu ích về các vấn đề sức khỏe dựa trên kiến thức y khoa. " +
                "Luôn sử dụng định dạng Markdown để câu trả lời được rõ ràng. " +
                "Nếu người dùng hỏi về vấn đề sức khỏe nghiêm trọng, khuyên họ nên đi khám bác sĩ hoặc đặt lịch tư vấn "
                +
                "với chuyên gia y tế trên HealApp. " +
                "Luôn trả lời với tư cách là trợ lý HealApp, tuyệt đối không cung cấp thông tin về các chủ đề " +
                "không liên quan đến sức khỏe hoặc cách sử dụng nền tảng HealApp.";
    }

    /**
     * Xác định xem câu hỏi có phải liên quan đến hệ thống không
     */
    private boolean isSystemQuery(String question) {
        String lowerCaseQuestion = question.toLowerCase();

        // Danh sách từ khóa liên quan đến hệ thống
        String[] systemKeywords = {
                "healapp", "ứng dụng", "đăng ký", "đăng nhập", "tài khoản", "mật khẩu",
                "đặt lịch", "chức năng", "tính năng", "sử dụng", "hệ thống", "thanh toán",
                "nạp tiền", "phí", "bài viết", "đăng bài", "câu hỏi", "hỏi đáp",
                "quên mật khẩu", "xác thực", "email", "danh mục", "category", "consultant",
                "chuyên gia", "bác sĩ", "lịch hẹn", "confirmed", "processing",
                "canceled", "admin", "staff", "user", "vô hiệu hóa", "video",
                "jitsi", "meet", "profile", "hồ sơ", "avatar", "thông tin"
        };

        for (String keyword : systemKeywords) {
            if (lowerCaseQuestion.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Thêm câu hỏi, câu trả lời vào lịch sử chat
     */
    private void addToHistory(Long userId, String question, String answer) {
        List<ChatMessage> userHistory = chatHistory.computeIfAbsent(userId, k -> new ArrayList<>());

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setUserId(userId);
        chatMessage.setQuestion(question);
        chatMessage.setAnswer(answer);
        chatMessage.setTimestamp(LocalDateTime.now());

        userHistory.add(0, chatMessage);

        if (userHistory.size() > maxHistoryLength) {
            userHistory = userHistory.subList(0, maxHistoryLength);
            chatHistory.put(userId, userHistory);
        }
    }

    /**
     * Lấy lịch sử chat của người dùng
     */
    public ApiResponse<List<ChatHistoryResponse>> getChatHistory(Long userId) {
        List<ChatMessage> userHistory = chatHistory.getOrDefault(userId, Collections.emptyList());

        // Tạo danh sách ChatHistoryResponse
        List<ChatHistoryResponse> historyResponses = new ArrayList<>();

        // Tạo một response chứa toàn bộ lịch sử chat
        ChatHistoryResponse historyResponse = new ChatHistoryResponse();
        historyResponse.setUserId(userId);
        historyResponse.setHistory(userHistory);

        // Thêm vào danh sách response
        historyResponses.add(historyResponse);

        return ApiResponse.success("Get chat history successfully", historyResponses);
    }

    /**
     * Xóa lịch sử chat của người dùng
     */
    public ApiResponse<Void> clearChatHistory(Long userId) {
        chatHistory.remove(userId);
        return ApiResponse.success("Chat history cleared", null);
    }
}