package com.healapp.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AIKnowledgeService {

        private static final Logger logger = LoggerFactory.getLogger(AIKnowledgeService.class);

        // Knowledge base
        private final Map<String, String> knowledgeBase = new HashMap<>();

        public AIKnowledgeService() {
                initializeKnowledgeBase();
                logger.info("Knowledge base initialized with {} topics", knowledgeBase.size());
        }

        // Khởi tạo Knowledge Base với thông tin dự án HealApp
        private void initializeKnowledgeBase() {
                // Quy trình đăng ký và xác minh email
                knowledgeBase.put("registration",
                                "# Quy trình đăng ký tài khoản HealApp\n\n" +
                                                "1. Người dùng truy cập màn hình đăng ký\n" +
                                                "2. Nhập email (QUAN TRỌNG: HealApp sử dụng email để xác thực)\n" +
                                                "3. Tạo mật khẩu (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, 1 ký tực đặc biệt và số)\n"
                                                +
                                                "4. Người dùng nhận email xác thực từ hệ thống\n" +
                                                "5. Trong vòng 10 phút, người dùng lấy mã xác thực trong email\n" +
                                                "6. Hệ thống kiểm tra mã xác thực (có thời hạn là 10 phút)\n"
                                                +
                                                "7. Sau khi xác thực, tài khoản được đăng kí và có thể đăng nhập\n\n" +
                                                "Cần lưu ý: Hệ thống có COOLDOWN_SECONDS là 60s giữa các lần gửi mã xác thực để tránh spam.");

                // Quy trình đặt lịch tư vấn
                knowledgeBase.put("consultation",
                                "# Quy trình đặt lịch tư vấn trên HealApp\n\n" +
                                                "1. Người dùng đăng nhập vào tài khoản\n" +
                                                "2. Chọn tính năng 'Đặt lịch tư vấn'\n" +
                                                "3. Chọn chuyên gia tư vấn từ danh sách\n"
                                                +
                                                "4. Xem các khung giờ còn trống của chuyên gia\n" +
                                                "5. Chọn ngày và khung giờ phù hợp\n" +
                                                "6. Xác nhận và thanh toán phí tư vấn (hỗ trợ thanh toán VISA hoặc COD)\n"
                                                +
                                                "7. Hệ thống tạo lịch tư vấn với trạng thái PENDING\n" +
                                                "8. Chuyên gia tư vấn xác nhận lịch hẹn và trạng thái chuyển thành CONFIRMED\n"
                                                +
                                                "9. Khi lịch hẹn được xác nhận, hệ thống tự động tạo URL Jitsi Meet\n" +
                                                "10. Cả khách hàng và chuyên gia đều có thể hủy lịch hẹn (CANCELED)\n\n"
                                                +
                                                "Lưu ý: Chỉ người đặt lịch và chuyên gia được chỉ định mới có thể xem và cập nhật lịch hẹn.");
                // Quy trình thanh toán/hoàn tiền
                knowledgeBase.put("payment",
                                "# Chính sách thanh toán và hoàn tiền trên HealApp\n\n" +
                                                "## Phương thức thanh toán\n" +
                                                "HealApp hỗ trợ hai phương thức thanh toán:\n" +
                                                "1. **Thanh toán COD (Cash On Delivery)**: Thanh toán khi tư vấn, không cần thanh toán trước\n"
                                                +
                                                "2. **Thanh toán VISA**: Thanh toán trực tuyến bằng thẻ VISA khi đặt lịch\n\n"
                                                +

                                                "## Quy trình thanh toán VISA\n" +
                                                "1. Người dùng chọn phương thức thanh toán VISA khi đặt lịch\n" +
                                                "2. Nhập thông tin thẻ (số thẻ, ngày hết hạn, mã CVC, tên chủ thẻ)\n" +
                                                "3. Hệ thống xử lý thanh toán qua Stripe API\n" +
                                                "4. Khi thanh toán thành công, lịch hẹn chuyển sang trạng thái PENDING\n"
                                                +
                                                "5. Nếu thanh toán thất bại, lịch hẹn sẽ ở trạng thái PAYMENT_FAILED\n\n"
                                                +

                                                "## Chính sách hoàn tiền\n" +
                                                "1. **Hoàn tiền tự động**: Khi lịch hẹn bị hủy (CANCELED), hệ thống sẽ **tự động hoàn tiền** nếu đã thanh toán bằng VISA\n"
                                                +
                                                "2. **Phương thức hoàn tiền**: Tiền sẽ được hoàn về thẻ đã dùng để thanh toán\n"
                                                +
                                                "3. **Điều kiện áp dụng**: Áp dụng cho mọi trường hợp hủy lịch, không phân biệt người hủy là khách hàng hay chuyên gia\n"
                                                +
                                                "4. **Thời gian hoàn tiền**: Việc hoàn tiền được xử lý ngay lập tức trong hệ thống, tuy nhiên thời gian tiền về tài khoản ngân hàng có thể mất từ 3-7 ngày làm việc tùy theo chính sách của ngân hàng phát hành thẻ\n"
                                                +
                                                "5. **Trường hợp đặc biệt**: Nếu có vấn đề trong quá trình hoàn tiền, người dùng nên liên hệ bộ phận hỗ trợ của HealApp\n\n"
                                                +

                                                "## Không áp dụng hoàn tiền\n" +
                                                "1. Đối với phương thức COD (chưa thanh toán) khi hủy lịch\n" +
                                                "2. Đối với các lịch hẹn đã hoàn thành (COMPLETED)\n\n" +

                                                "Lưu ý quan trọng: Nếu gặp vấn đề liên quan đến thanh toán hoặc hoàn tiền, vui lòng liên hệ bộ phận hỗ trợ khách hàng của HealApp để được giải quyết nhanh chóng.");

                // Thông tin về tính chu kỳ kinh nguyệt
                knowledgeBase.put("menstrual-cycle",
                                "# Tính chu kỳ kinh nguyệt trên HealApp\n\n" +
                                                "## Tính năng tính chu kỳ kinh nguyệt\n" +
                                                "HealApp cung cấp tính năng tính toán và theo dõi chu kỳ kinh nguyệt với các chức năng:\n\n"
                                                +
                                                "1. **Tính toán chu kỳ**: Người dùng nhập các thông tin:\n" +
                                                "   - Ngày bắt đầu chu kỳ gần nhất\n" +
                                                "   - Số ngày hành kinh (thường từ 3-7 ngày)\n" +
                                                "   - Độ dài chu kỳ (thường từ 21-35 ngày, trung bình 28 ngày)\n\n" +
                                                "2. **Kết quả tính toán**:\n" +
                                                "   - Ngày bắt đầu và kết thúc chu kỳ hiện tại\n" +
                                                "   - Ngày rụng trứng dự kiến\n" +
                                                "   - Khoảng thời gian dễ thụ thai\n" +
                                                "   - Chu kỳ tiếp theo dự kiến\n" +
                                                "   - Xác suất mang thai hiện tại\n\n" +
                                                "3. **Lưu trữ lịch sử chu kỳ**:\n" +
                                                "   - Người dùng đã đăng nhập có thể lưu thông tin chu kỳ\n" +
                                                "   - Xem lịch sử các chu kỳ đã lưu\n" +
                                                "   - Nhận thông báo nhắc nhở về chu kỳ\n\n" +
                                                "4. **Quản lý chu kỳ**:\n" +
                                                "   - Bật/tắt nhắc nhở cho từng chu kỳ\n" +
                                                "   - Xóa chu kỳ không mong muốn\n\n" +
                                                "## Cách sử dụng tính năng\n" +
                                                "1. Truy cập trang 'Tính chu kỳ kinh nguyệt' từ menu chính\n" +
                                                "2. Nhập thông tin theo form yêu cầu\n" +
                                                "3. Nhấn 'Tính toán' để xem kết quả\n" +
                                                "4. Đăng nhập để lưu lịch sử và nhận nhắc nhở\n\n" +
                                                "## Lưu ý quan trọng\n" +
                                                "- Tính năng này chỉ mang tính tham khảo, không thay thế tư vấn y tế chuyên nghiệp\n"
                                                +
                                                "- Chu kỳ kinh nguyệt có thể thay đổi do nhiều yếu tố như stress, thay đổi cân nặng, tập luyện quá mức\n"
                                                +
                                                "- Phụ nữ nên theo dõi chu kỳ liên tục để nhận biết bất thường");
                // Quy trình hỏi đáp
                knowledgeBase.put("question",
                                "# Quy trình hỏi đáp trên HealApp\n\n" +
                                                "1. Người dùng đăng nhập và đặt câu hỏi (chọn danh mục cho câu hỏi)\n" +
                                                "2. Câu hỏi được tạo với trạng thái PROCESSING\n" +
                                                "3. Nhân viên (STAFF) xem xét và có thể:\n" +
                                                "   - Xác nhận câu hỏi (chuyển sang CONFIRMED)\n" +
                                                "   - Từ chối câu hỏi (chuyển sang CANCELED)\n" +
                                                "4. Câu hỏi được xác nhận (CONFIRMED) có thể được trả lời bởi:\n" +
                                                "   - Nhân viên (STAFF)\n" +
                                                "   - Chuyên gia tư vấn (CONSULTANT)\n" +
                                                "5. Khi được trả lời, câu hỏi chuyển sang trạng thái ANSWERED\n\n" +
                                                "Quyền hạn đối với câu hỏi:\n" +
                                                "- Chủ sở hữu (người đặt câu hỏi): Xem câu hỏi và câu trả lời\n" +
                                                "- STAFF: Xem, cập nhật trạng thái, trả lời và xóa câu hỏi\n" +
                                                "- CONSULTANT: Xem và trả lời câu hỏi đã được xác nhận\n" +
                                                "- Người dùng khác: Không có quyền truy cập\n\n" +
                                                "Luồng trạng thái câu hỏi: PROCESSING → CONFIRMED → ANSWERED hoặc PROCESSING → CANCELED");

                // Quy trình bài viết
                knowledgeBase.put("blog",
                                "# Quy trình quản lý bài viết trên HealApp\n\n" +
                                                "1. Người dùng đăng nhập và tạo bài viết mới\n" +
                                                "2. Quy tắc trạng thái bài viết theo vai trò:\n" +
                                                "   - USER/CONSULTANT: Bài viết mới có trạng thái PROCESSING (cần duyệt)\n"
                                                +
                                                "   - STAFF/ADMIN: Bài viết mới tự động có trạng thái CONFIRMED (không cần duyệt)\n"
                                                +
                                                "3. STAFF/ADMIN xem xét các bài viết PROCESSING\n" +
                                                "4. STAFF/ADMIN duyệt bài và chuyển sang trạng thái CONFIRMED\n\n" +
                                                "Quy tắc quan trọng:\n" +
                                                "- Bài viết ở trạng thái CONFIRMED không thể chỉnh sửa\n" +
                                                "- Nếu chỉnh sửa, bài viết sẽ quay lại trạng thái PROCESSING và cần được duyệt lại\n"
                                                +
                                                "- Chỉ bài viết ở trạng thái CONFIRMED mới hiển thị công khai");

                // Quản lý danh mục câu hỏi
                knowledgeBase.put("category",
                                "# Quản lý danh mục câu hỏi trên HealApp\n\n" +
                                                "1. Chỉ ADMIN mới có thể tạo, cập nhật và xóa danh mục câu hỏi\n" +
                                                "2. Khi xóa danh mục:\n" +
                                                "   - Tất cả câu hỏi ở trạng thái PROCESSING hoặc CONFIRMED thuộc danh mục sẽ bị hủy (CANCELED)\n"
                                                +
                                                "   - Câu hỏi đã được trả lời (ANSWERED) hoặc đã bị hủy (CANCELED) sẽ không bị thay đổi\n"
                                                +
                                                "3. Không thể tạo hai danh mục có cùng tên");

                // Quản lý người dùng
                knowledgeBase.put("user",
                                "# Quản lý người dùng trên HealApp\n\n" +
                                                "1. Các vai trò trong hệ thống: USER, CONSULTANT, STAFF, ADMIN\n" +
                                                "2. ADMIN có quyền vô hiệu hóa tài khoản (đặt isActive = false)\n" +
                                                "3. ADMIN có thể thay đổi vai trò của người dùng\n" +
                                                "4. Người dùng đã bị vô hiệu hóa không thể đăng nhập vào hệ thống");

                // Thông tin về giới hạn của chatbot
                knowledgeBase.put("limitations",
                                "# Phạm vi hỗ trợ của HealApp Chatbot\n\n" +
                                                "HealApp Chatbot được thiết kế để hỗ trợ người dùng trong các lĩnh vực:\n\n"
                                                +
                                                "1. **Y tế và sức khỏe**:\n" +
                                                "   - Thông tin y tế chung (không thay thế tư vấn y khoa chuyên nghiệp)\n"
                                                +
                                                "   - Lời khuyên về sức khỏe và lối sống lành mạnh\n" +
                                                "   - Giải thích về các triệu chứng thông thường\n\n" +
                                                "2. **Cách sử dụng HealApp**:\n" +
                                                "   - Hướng dẫn đăng ký, đăng nhập\n" +
                                                "   - Quy trình đặt lịch tư vấn\n" +
                                                "   - Quy trình đặt câu hỏi và nhận câu trả lời\n" +
                                                "   - Quản lý bài viết và tài khoản\n\n" +
                                                "HealApp Chatbot **KHÔNG** cung cấp thông tin về các chủ đề sau:\n" +
                                                "- Tôn giáo, chính trị, xung đột\n" +
                                                "- Các vấn đề pháp lý và tư vấn pháp luật\n" +
                                                "- Đầu tư tài chính, chứng khoán\n" +
                                                "- Chủ đề nhạy cảm hoặc gây tranh cãi\n" +
                                                "- Nội dung bạo lực, phân biệt đối xử\n\n" +
                                                "Khi nhận được câu hỏi ngoài phạm vi hỗ trợ, chatbot sẽ nhắc nhở người dùng về giới hạn và đề nghị họ đặt câu hỏi liên quan đến sức khỏe hoặc HealApp.");
        }

        // prompt dựa trên câu hỏi của người dùng
        public String createEnhancedSystemPrompt(String userQuestion) {
                StringBuilder promptBuilder = new StringBuilder();

                // Phần mở đầu
                promptBuilder.append(
                                "Bạn là trợ lý hỗ trợ hệ thống của ứng dụng HealApp - một nền tảng chăm sóc sức khỏe trực tuyến. ");
                promptBuilder
                                .append("Hãy trả lời dựa trên thông tin chính xác về quy trình và luồng làm việc của HealApp.\n\n");

                // Luôn thêm thông tin về giới hạn vào prompt
                promptBuilder.append(knowledgeBase.get("limitations")).append("\n\n");

                // Tìm các chủ đề liên quan nhất để thêm vào prompt
                List<String> relevantTopics = findRelevantTopics(userQuestion.toLowerCase(), 3);

                // Thêm các chủ đề liên quan vào prompt
                for (String topic : relevantTopics) {
                        if (!topic.equals("limitations")) {
                                promptBuilder.append(knowledgeBase.get(topic)).append("\n\n");
                        }
                }

                // Hướng dẫn cho AI
                promptBuilder.append(
                                "Hãy trả lời câu hỏi sau dựa trên thông tin chính xác về HealApp ở trên, sử dụng định dạng Markdown và giọng điệu thân thiện. ");
                promptBuilder.append("Nếu câu hỏi ngoài phạm vi hỗ trợ của bạn (như đã nêu trong phần giới hạn), ");
                promptBuilder.append("hãy lịch sự từ chối và nhắc người dùng rằng bạn chỉ có thể trả lời về sức khỏe ");
                promptBuilder.append("hoặc cách sử dụng HealApp: ").append(userQuestion);

                return promptBuilder.toString();
        }

        // Tìm các chủ đề liên quan nhất dựa trên từ khóa trong câu hỏi
        private List<String> findRelevantTopics(String question, int maxTopics) {
                Map<String, String[]> topicKeywords = new HashMap<>();

                // Định nghĩa từ khóa cho từng chủ đề
                topicKeywords.put("registration",
                                new String[] { "đăng ký", "tạo tài khoản", "đăng nhập", "mật khẩu", "email",
                                                "xác thực", "xác minh", "xác nhận", "tài khoản" });
                topicKeywords.put("consultation",
                                new String[] { "đặt lịch", "tư vấn", "bác sĩ", "chuyên gia", "lịch hẹn",
                                                "jitsi", "thanh toán", "visa", "khung giờ", "hủy lịch", "confirmed" });
                topicKeywords.put("question",
                                new String[] { "câu hỏi", "hỏi đáp", "trả lời", "đặt câu hỏi", "processing",
                                                "confirmed", "canceled", "answered" });
                topicKeywords.put("blog",
                                new String[] { "bài viết", "blog", "đăng bài", "viết bài", "duyệt bài", "pending",
                                                "confirmed" });
                topicKeywords.put("category",
                                new String[] { "danh mục", "category", "chủ đề", "chủ đề câu hỏi", "phân loại" });
                topicKeywords.put("user",
                                new String[] { "người dùng", "user", "vai trò", "quyền", "consultant", "staff",
                                                "admin", "vô hiệu hóa", "kích hoạt" });
                topicKeywords.put("payment", new String[] { "thanh toán", "hoàn tiền", "hủy lịch", "huỷ lịch", "visa",
                                "thẻ", "refund", "stripe", "cod", "hủy đặt lịch", "huỷ đặt lịch", "trả lại tiền",
                                "tiền về" });
                topicKeywords.put("menstrual-cycle", new String[] {
                                "chu kỳ kinh nguyệt","chu kì kinh nguyệt", "kinh nguyệt", "ngày đèn đỏ", "hành kinh",
                                "ngày rụng trứng", "chu kì", "chu ky", "kinh nguyet",
                                "ngày dễ thụ thai", "thụ thai", "mang thai", "xác suất mang thai",
                                "tính ngày", "dự đoán", "kinh nguyệt không đều", "theo dõi chu kỳ",
                                "nhắc nhở chu kỳ", "ngày an toàn", "ngày nguy hiểm", "kỳ kinh"
                });

                // Tính điểm liên quan cho từng chủ đề
                Map<String, Integer> scores = new HashMap<>();
                for (Map.Entry<String, String[]> entry : topicKeywords.entrySet()) {
                        int score = 0;
                        for (String keyword : entry.getValue()) {
                                if (question.contains(keyword)) {
                                        score++;
                                }
                        }
                        if (score > 0) {
                                scores.put(entry.getKey(), score);
                        }
                }

                // Sắp xếp chủ đề theo điểm liên quan giảm dần
                List<Map.Entry<String, Integer>> sortedScores = new ArrayList<>(scores.entrySet());
                sortedScores.sort((e1, e2) -> e2.getValue().compareTo(e1.getValue()));

                // Lấy tối đa maxTopics chủ đề
                List<String> relevantTopics = new ArrayList<>();
                int count = 0;
                for (Map.Entry<String, Integer> entry : sortedScores) {
                        if (count >= maxTopics)
                                break;
                        relevantTopics.add(entry.getKey());
                        count++;
                }

                // Trường hợp không tìm thấy chủ đề nào liên quan, thêm các chủ đề mặc định
                if (relevantTopics.isEmpty()) {
                        relevantTopics.add("registration");
                        relevantTopics.add("consultation");
                }

                return relevantTopics;
        }
}