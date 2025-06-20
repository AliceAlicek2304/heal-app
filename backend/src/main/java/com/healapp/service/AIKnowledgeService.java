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

        // Topic keywords for search
        private Map<String, String[]> topicKeywords;

        public AIKnowledgeService() {
                initializeKnowledgeBase();
                logger.info("Knowledge base initialized with {} topics", knowledgeBase.size());
        }

        // Khởi tạo Knowledge Base với thông tin dự án HealApp
        private void initializeKnowledgeBase() {
                // Quy trình đăng ký và xác minh email
                knowledgeBase.put("registration",
                                "# Quy trình đăng ký tài khoản HealApp cho người dùng\n\n" +
                                                "1. Người dùng truy cập màn hình đăng ký\n" +
                                                "2. Nhập email (QUAN TRỌNG: HealApp sử dụng email để xác thực)\n" +
                                                "3. Tạo mật khẩu (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, 1 ký tực đặc biệt và số)\n"
                                                +
                                                "4. Người dùng nhận email xác thực từ hệ thống\n" +
                                                "5. Trong vòng 10 phút, người dùng lấy mã xác thực trong email\n" +
                                                "6. Hệ thống kiểm tra mã xác thực (có thời hạn là 10 phút)\n" +
                                                "7. Sau khi xác thực, tài khoản được đăng kí và có thể đăng nhập\n\n" +
                                                "Cần lưu ý: Hệ thống có COOLDOWN_SECONDS là 60s giữa các lần gửi mã xác thực để tránh spam.");

                // Quy trình đặt lịch tư vấn
                knowledgeBase.put("consultation",
                                "# Quy trình đặt lịch tư vấn trên HealApp cho người dùng\n\n" +
                                                "1. Người dùng đăng nhập vào tài khoản\n" +
                                                "2. Chọn tính năng 'Đặt lịch tư vấn'\n" +
                                                "3. Chọn chuyên gia tư vấn từ danh sách (hiển thị thông tin chuyên gia, chuyên môn và đánh giá)\n"
                                                +
                                                "4. Xem các khung giờ còn trống của chuyên gia\n" +
                                                "5. Chọn ngày và khung giờ phù hợp\n" +
                                                "6. Nhập mô tả vấn đề cần tư vấn\n" +
                                                "7. Xác nhận và thanh toán phí tư vấn (hỗ trợ thanh toán COD, VISA hoặc QR_CODE)\n"
                                                +
                                                "8. Nhận thông báo xác nhận đặt lịch qua email\n" +
                                                "9. Nhận thông báo nhắc nhở trước thời gian tư vấn\n" +
                                                "10. Tham gia buổi tư vấn theo hình thức đã chọn (trực tiếp hoặc online)\n"
                                                +
                                                "11. Sau buổi tư vấn, người dùng có thể đánh giá chuyên gia tư vấn (1-5 sao) và viết nhận xét\n"
                                                +
                                                "12. Lịch sử tư vấn được lưu trong hồ sơ cá nhân của người dùng\n\n" +
                                                "Người dùng có thể hủy lịch hẹn trước thời điểm tư vấn 24 giờ, nhận lại tiền nếu đã thanh toán trực tuyến.");

                // Quy trình xét nghiệm STI đơn lẻ
                knowledgeBase.put("sti_service",
                                "# Quy trình đặt lịch và xét nghiệm STI đơn lẻ cho người dùng\n\n" +
                                                "1. Người dùng truy cập trang STI Testing\n" +
                                                "2. Xem danh sách các dịch vụ xét nghiệm STI đơn lẻ với thông tin chi tiết\n"
                                                +
                                                "3. Người dùng có thể lọc và tìm kiếm dịch vụ phù hợp\n" +
                                                "4. Xem các đánh giá và nhận xét của dịch vụ từ người dùng khác\n" +
                                                "5. Chọn dịch vụ phù hợp và nhấn 'Đặt lịch xét nghiệm'\n" +
                                                "6. Điền thông tin đặt lịch: ngày hẹn, thông tin liên hệ\n" +
                                                "7. Chọn phương thức thanh toán: COD (thanh toán khi đến cơ sở), VISA (thanh toán qua thẻ), hoặc QR_CODE (quét mã QR thanh toán)\n"
                                                +
                                                "8. Xác nhận đặt lịch và nhận thông báo xác nhận qua email\n" +
                                                "9. Nhận thông báo nhắc lịch hẹn vào ngày xét nghiệm\n" +
                                                "10. Đến cơ sở y tế để thực hiện xét nghiệm theo lịch hẹn\n" +
                                                "11. Người dùng nhận thông báo khi có kết quả xét nghiệm\n" +
                                                "12. Truy cập hệ thống để xem kết quả xét nghiệm chi tiết\n" +
                                                "13. Có thể đánh giá chất lượng dịch vụ sau khi nhận kết quả (1-5 sao)\n"
                                                +
                                                "14. Xem lịch sử xét nghiệm trong hồ sơ cá nhân của người dùng");

                // Quy trình xét nghiệm STI Package
                knowledgeBase.put("sti_package",
                                "# Quy trình đặt lịch và xét nghiệm gói STI Package cho người dùng\n\n" +
                                                "1. Người dùng truy cập trang STI Testing\n" +
                                                "2. Xem danh sách các gói combo xét nghiệm (hiển thị ở phần trên trang)\n"
                                                +
                                                "3. Mỗi gói combo bao gồm nhiều dịch vụ STI với giá ưu đãi hơn mua lẻ\n"
                                                +
                                                "4. Xem danh sách các dịch vụ nằm trong gói, giá gói, và số tiền tiết kiệm\n"
                                                +
                                                "5. Xem đánh giá và nhận xét của người dùng khác về gói combo\n" +
                                                "6. Chọn gói combo phù hợp và nhấn 'Đặt Gói Combo'\n" +
                                                "7. Điền thông tin đặt lịch: ngày hẹn, thông tin liên hệ\n" +
                                                "8. Chọn phương thức thanh toán: COD, VISA hoặc QR_CODE\n" +
                                                "9. Xác nhận đặt lịch và nhận thông báo xác nhận qua email\n" +
                                                "10. Nhận thông báo nhắc lịch hẹn vào ngày xét nghiệm\n" +
                                                "11. Đến cơ sở y tế để thực hiện xét nghiệm theo lịch hẹn\n" +
                                                "12. Người dùng nhận thông báo khi có kết quả xét nghiệm\n" +
                                                "13. Truy cập hệ thống để xem kết quả xét nghiệm chi tiết của từng dịch vụ trong gói\n"
                                                +
                                                "14. Có thể đánh giá chất lượng gói combo sau khi nhận kết quả (1-5 sao)\n"
                                                +
                                                "15. Xem lịch sử xét nghiệm trong hồ sơ cá nhân của người dùng");

                // Quy trình thanh toán qua QR Code
                knowledgeBase.put("payment_qr",
                                "# Quy trình thanh toán QR Code cho người dùng\n\n" +
                                                "1. Người dùng chọn phương thức thanh toán QR Code khi đặt lịch\n" +
                                                "2. Hệ thống hiển thị mã QR chứa thông tin thanh toán\n" +
                                                "3. Người dùng mở ứng dụng ngân hàng và quét mã QR\n" +
                                                "4. Xác nhận thanh toán trên ứng dụng ngân hàng\n" +
                                                "5. Hệ thống nhận thông báo thanh toán và cập nhật trạng thái lịch hẹn\n"
                                                +
                                                "6. Khi thanh toán thành công, lịch hẹn chuyển sang trạng thái PENDING\n"
                                                +
                                                "7. Nếu thanh toán thất bại hoặc hết thời gian, lịch hẹn sẽ ở trạng thái PAYMENT_FAILED\n\n"
                                                +

                                                "## Ưu điểm thanh toán QR Code\n" +
                                                "- **Nhanh chóng**: Chỉ cần quét mã và xác nhận\n" +
                                                "- **An toàn**: Không cần chia sẻ thông tin thẻ\n" +
                                                "- **Tiện lợi**: Sử dụng ứng dụng ngân hàng có sẵn\n" +
                                                "- **Hỗ trợ đa ngân hàng**: Tương thích với hầu hết các ngân hàng tại Việt Nam\n\n"
                                                +

                                                "## Chính sách hoàn tiền\n" +
                                                "1. **Hoàn tiền tự động**: Khi lịch hẹn bị hủy (CANCELED), hệ thống sẽ **tự động hoàn tiền** nếu đã thanh toán bằng VISA hoặc QR Code\n"
                                                +
                                                "2. **Phương thức hoàn tiền**:\n" +
                                                "   - VISA: Tiền sẽ được hoàn về thẻ đã dùng để thanh toán\n" +
                                                "   - QR Code: Tiền sẽ được hoàn về tài khoản ngân hàng đã thực hiện thanh toán\n"
                                                +
                                                "3. **Điều kiện áp dụng**: Áp dụng cho mọi trường hợp hủy lịch, không phân biệt người hủy là khách hàng hay chuyên gia\n"
                                                +
                                                "4. **Thời gian hoàn tiền**: \n" +
                                                "   - VISA: 3-7 ngày làm việc tùy theo ngân hàng phát hành thẻ\n" +
                                                "   - QR Code: 1-3 ngày làm việc tùy theo ngân hàng\n" +
                                                "5. **Trường hợp đặc biệt**: Nếu có vấn đề trong quá trình hoàn tiền, người dùng nên liên hệ bộ phận hỗ trợ của HealApp\n\n"
                                                +

                                                "## Không áp dụng hoàn tiền\n" +
                                                "1. Đối với phương thức COD (chưa thanh toán) khi hủy lịch\n" +
                                                "2. Đối với các lịch hẹn đã hoàn thành (COMPLETED)\n\n" +

                                                "Lưu ý quan trọng: Nếu gặp vấn đề liên quan đến thanh toán hoặc hoàn tiền, vui lòng liên hệ bộ phận hỗ trợ khách hàng của HealApp để được giải quyết nhanh chóng.");

                // Quy trình thanh toán qua VISA
                knowledgeBase.put("payment_visa",
                                "# Quy trình thanh toán VISA cho người dùng\n\n" +
                                                "1. Người dùng chọn phương thức thanh toán VISA khi đặt lịch\n" +
                                                "2. Hệ thống chuyển hướng đến cổng thanh toán an toàn\n" +
                                                "3. Người dùng nhập thông tin thẻ VISA/Master/JCB (số thẻ, tên chủ thẻ, ngày hết hạn, mã CVV)\n"
                                                +
                                                "4. Xác nhận thanh toán (một số ngân hàng yêu cầu xác thực bổ sung như OTP)\n"
                                                +
                                                "5. Cổng thanh toán xử lý giao dịch và chuyển hướng về HealApp\n" +
                                                "6. Khi thanh toán thành công, lịch hẹn chuyển sang trạng thái PENDING\n"
                                                +
                                                "7. Nếu thanh toán thất bại hoặc bị hủy, lịch hẹn sẽ ở trạng thái PAYMENT_FAILED\n\n"
                                                +

                                                "## Ưu điểm thanh toán VISA\n" +
                                                "- **Tiện lợi**: Thanh toán ngay không cần chuyển khoản\n" +
                                                "- **An toàn**: Sử dụng cổng thanh toán bảo mật tiêu chuẩn quốc tế\n" +
                                                "- **Xác nhận ngay**: Kết quả giao dịch được xác nhận ngay lập tức\n" +
                                                "- **Ghi nhận giao dịch**: Có lịch sử thanh toán đầy đủ cho mục đích kế toán\n\n"
                                                +

                                                "## Lưu ý khi thanh toán VISA\n" +
                                                "- Đảm bảo thẻ được kích hoạt thanh toán trực tuyến\n" +
                                                "- Giữ điện thoại bên cạnh để nhận mã OTP khi cần\n" +
                                                "- HealApp không lưu trữ thông tin thẻ của người dùng\n" +
                                                "- Giao dịch được bảo vệ bởi cổng thanh toán được cấp phép");

                // Quy trình thanh toán COD
                knowledgeBase.put("payment_cod",
                                "# Quy trình thanh toán COD (Cash On Delivery) cho người dùng\n\n" +
                                                "1. Người dùng chọn phương thức thanh toán COD khi đặt lịch\n" +
                                                "2. Hệ thống xác nhận đặt lịch và chuyển trạng thái sang PENDING\n" +
                                                "3. Người dùng nhận xác nhận đặt lịch qua email/ứng dụng\n" +
                                                "4. Người dùng đến cơ sở y tế/phòng khám theo lịch hẹn\n" +
                                                "5. Thanh toán trực tiếp bằng tiền mặt tại quầy lễ tân\n" +
                                                "6. Nhận biên lai/hóa đơn thanh toán\n" +
                                                "7. Trạng thái đơn hàng được cập nhật thành PAID sau khi thanh toán\n\n"
                                                +

                                                "## Ưu điểm thanh toán COD\n" +
                                                "- **Đơn giản**: Không cần thẻ hoặc tài khoản ngân hàng\n" +
                                                "- **An toàn**: Chỉ thanh toán khi đến nhận dịch vụ\n" +
                                                "- **Không phí giao dịch**: Không mất phí chuyển tiền/phí xử lý\n\n" +

                                                "## Lưu ý khi thanh toán COD\n" +
                                                "- Mang đủ số tiền cần thanh toán (ưu tiên tiền mặt)\n" +
                                                "- Một số cơ sở cũng chấp nhận thanh toán qua thẻ tại quầy\n" +
                                                "- Vẫn cần đến đúng giờ hẹn dù chưa thanh toán trước\n" +
                                                "- Nếu không đến theo lịch hẹn mà không hủy trước, có thể bị hạn chế đặt lịch trong tương lai");

                // Thông tin về tính chu kỳ kinh nguyệt
                knowledgeBase.put("menstrual-cycle",
                                "# Tính chu kỳ kinh nguyệt trên HealApp cho người dùng\n\n" +
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
                                                "   - Xóa chu kỳ không mong muốn\n" +
                                                "   - Ghi chú triệu chứng (đau bụng, mệt mỏi, v.v.)\n" +
                                                "   - Theo dõi cảm xúc và sức khỏe trong chu kỳ\n\n" +
                                                "5. **Dự đoán thông minh**:\n" +
                                                "   - Hệ thống học từ dữ liệu của người dùng\n" +
                                                "   - Dự đoán chu kỳ chính xác hơn theo thời gian\n" +
                                                "   - Thông báo nếu chu kỳ bất thường\n\n" +
                                                "## Cách sử dụng tính năng\n" +
                                                "1. Truy cập trang 'Tính chu kỳ kinh nguyệt' từ menu chính\n" +
                                                "2. Nhập thông tin theo form yêu cầu\n" +
                                                "3. Nhấn 'Tính toán' để xem kết quả\n" +
                                                "4. Lưu kết quả vào tài khoản nếu muốn theo dõi dài hạn\n" +
                                                "5. Đặt nhắc nhở cho các ngày quan trọng");

                // Thông tin về Blog
                knowledgeBase.put("blog",
                                "# Tính năng Blog trên HealApp cho người dùng\n\n" +
                                                "## Đọc bài viết Blog\n" +
                                                "1. Người dùng truy cập mục Blog từ menu chính\n" +
                                                "2. Xem danh sách các bài viết mới nhất về sức khỏe phụ nữ\n" +
                                                "3. Lọc bài viết theo chủ đề: kinh nguyệt, sức khỏe sinh sản, STI, dinh dưỡng, v.v.\n"
                                                +
                                                "4. Tìm kiếm bài viết theo từ khóa quan tâm\n" +
                                                "5. Nhấp vào bài viết để đọc nội dung chi tiết\n" +
                                                "6. Xem các bài viết liên quan ở cuối trang\n\n" +

                                                "## Tương tác với Blog\n" +
                                                "1. Đăng nhập để tương tác với bài viết\n" +
                                                "2. 'Thích' bài viết yêu thích\n" +
                                                "3. Bình luận chia sẻ ý kiến về bài viết\n" +
                                                "4. Chia sẻ bài viết qua mạng xã hội hoặc email\n" +
                                                "5. Lưu bài viết vào 'Đã lưu' để đọc sau\n" +
                                                "6. Theo dõi tác giả để nhận thông báo bài viết mới\n\n" +

                                                "## Nội dung Blog\n" +
                                                "- Bài viết chất lượng từ các chuyên gia y tế\n" +
                                                "- Thông tin y khoa được kiểm chứng\n" +
                                                "- Cập nhật các nghiên cứu y học mới nhất\n" +
                                                "- Các bài viết về tâm lý sức khỏe\n" +
                                                "- Thảo luận về các vấn đề phổ biến của phụ nữ\n" +
                                                "- Hướng dẫn phòng ngừa bệnh\n" +
                                                "- Tips và lời khuyên cho cuộc sống hàng ngày");

                // Thông tin về Hỏi đáp
                knowledgeBase.put("questions",
                                "# Tính năng Hỏi đáp trên HealApp cho người dùng\n\n" +
                                                "## Đặt câu hỏi\n" +
                                                "1. Người dùng truy cập mục Hỏi đáp từ menu chính\n" +
                                                "2. Đăng nhập vào tài khoản (bắt buộc để đặt câu hỏi)\n" +
                                                "3. Nhấn nút 'Đặt câu hỏi'\n" +
                                                "4. Nhập tiêu đề và nội dung câu hỏi chi tiết\n" +
                                                "5. Chọn chủ đề liên quan (sức khỏe sinh sản, kinh nguyệt, v.v.)\n" +
                                                "6. Tùy chọn chế độ ẩn danh nếu muốn giữ kín thông tin\n" +
                                                "7. Gửi câu hỏi và chờ phản hồi\n\n" +

                                                "## Xem và tương tác với câu trả lời\n" +
                                                "1. Nhận thông báo khi có câu trả lời mới\n" +
                                                "2. Xem câu trả lời từ chuyên gia y tế\n" +
                                                "3. Đánh giá câu trả lời (hữu ích/không hữu ích)\n" +
                                                "4. Đặt câu hỏi bổ sung liên quan đến câu trả lời\n" +
                                                "5. Cảm ơn người trả lời\n\n" +

                                                "## Duyệt câu hỏi có sẵn\n" +
                                                "1. Tìm kiếm câu hỏi theo từ khóa\n" +
                                                "2. Lọc câu hỏi theo chủ đề\n" +
                                                "3. Xem các câu hỏi phổ biến/xu hướng\n" +
                                                "4. Đọc các cặp câu hỏi-trả lời có sẵn\n" +
                                                "5. Lưu câu hỏi hữu ích để tham khảo sau\n\n" +

                                                "## Lưu ý khi đặt câu hỏi\n" +
                                                "- Mô tả chi tiết vấn đề để nhận câu trả lời chính xác\n" +
                                                "- Tuân thủ quy tắc cộng đồng, không dùng ngôn từ không phù hợp\n" +
                                                "- Câu hỏi sẽ được kiểm duyệt trước khi xuất hiện công khai\n" +
                                                "- Thời gian trả lời thường từ 24-48 giờ\n" +
                                                "- Câu trả lời chỉ mang tính chất tham khảo, không thay thế tư vấn y tế trực tiếp");

                // Quy trình đánh giá
                knowledgeBase.put("rating",
                                "# Quy trình đánh giá trên HealApp cho người dùng\n\n" +
                                                "## Đánh giá dịch vụ STI đơn lẻ\n" +
                                                "1. Hoàn thành xét nghiệm và nhận kết quả\n" +
                                                "2. Vào mục 'Lịch sử xét nghiệm' trong hồ sơ cá nhân\n" +
                                                "3. Tìm dịch vụ muốn đánh giá và nhấn 'Đánh giá'\n" +
                                                "4. Chọn số sao đánh giá (1-5 sao)\n" +
                                                "5. Viết nhận xét chi tiết về trải nghiệm\n" +
                                                "6. Gửi đánh giá\n" +
                                                "7. Đánh giá sẽ hiển thị công khai sau khi được kiểm duyệt\n\n" +

                                                "## Đánh giá gói STI Package\n" +
                                                "1. Hoàn thành gói xét nghiệm và nhận kết quả đầy đủ\n" +
                                                "2. Vào mục 'Lịch sử xét nghiệm' trong hồ sơ cá nhân\n" +
                                                "3. Tìm gói Package muốn đánh giá và nhấn 'Đánh giá'\n" +
                                                "4. Chọn số sao đánh giá (1-5 sao)\n" +
                                                "5. Viết nhận xét về trải nghiệm tổng thể với gói Package\n" +
                                                "6. Gửi đánh giá\n" +
                                                "7. Đánh giá sẽ hiển thị công khai sau khi được kiểm duyệt\n\n" +

                                                "## Đánh giá tư vấn viên\n" +
                                                "1. Hoàn thành buổi tư vấn\n" +
                                                "2. Vào mục 'Lịch sử tư vấn' trong hồ sơ cá nhân\n" +
                                                "3. Tìm buổi tư vấn muốn đánh giá và nhấn 'Đánh giá'\n" +
                                                "4. Chọn số sao đánh giá cho từng tiêu chí (chuyên môn, thái độ, giải đáp)\n"
                                                +
                                                "5. Viết nhận xét chi tiết về trải nghiệm với tư vấn viên\n" +
                                                "6. Gửi đánh giá\n" +
                                                "7. Đánh giá sẽ hiển thị công khai sau khi được kiểm duyệt\n\n" +

                                                "## Xem đánh giá từ người khác\n" +
                                                "1. Truy cập trang chi tiết dịch vụ/gói package/tư vấn viên\n" +
                                                "2. Xem badge đánh giá hiển thị số sao trung bình và số lượng đánh giá\n"
                                                +
                                                "3. Nhấp vào badge để xem chi tiết các đánh giá\n" +
                                                "4. Lọc đánh giá theo số sao hoặc từ khóa\n" +
                                                "5. Đọc các nhận xét để tham khảo trước khi đặt dịch vụ");

                // Thêm các chủ đề khác của HealApp
                // ...

                // Từ khóa liên quan đến các chủ đề để tìm kiếm
                topicKeywords = new HashMap<>();

                // Từ khóa cho đăng ký
                topicKeywords.put("registration", new String[] {
                                "đăng ký", "tạo tài khoản", "sign up", "register", "tài khoản mới",
                                "xác minh email", "mã xác thực", "verification code", "mật khẩu", "quên mật khẩu"
                });

                // Từ khóa cho đặt lịch tư vấn
                topicKeywords.put("consultation", new String[] {
                                "tư vấn", "đặt lịch", "chuyên gia", "consultant", "booking",
                                "hỏi đáp", "expert", "consultation", "tư vấn viên", "phòng chat"
                });

                // Từ khóa cho xét nghiệm STI đơn lẻ
                topicKeywords.put("sti_service", new String[] {
                                "xét nghiệm", "STI", "dịch vụ", "đặt lịch xét nghiệm", "kết quả xét nghiệm",
                                "test", "bệnh lây truyền", "lây nhiễm", "kiểm tra sức khỏe", "sexually transmitted"
                });

                // Từ khóa cho gói combo STI
                topicKeywords.put("sti_package", new String[] {
                                "gói", "combo", "package", "gói xét nghiệm", "combo STI",
                                "ưu đãi", "tiết kiệm", "nhiều xét nghiệm", "bundle", "trọn gói"
                });

                // Từ khóa cho thanh toán QR Code
                topicKeywords.put("payment_qr", new String[] {
                                "QR", "quét mã", "thanh toán QR", "QR Code", "QR_CODE",
                                "quét", "banking", "ngân hàng", "chuyển khoản", "thanh toán di động"
                });

                // Từ khóa cho thanh toán VISA
                topicKeywords.put("payment_visa", new String[] {
                                "VISA", "thẻ tín dụng", "credit card", "master card", "JCB",
                                "thanh toán thẻ", "card payment", "cổng thanh toán", "payment gateway", "trực tuyến"
                });

                // Từ khóa cho thanh toán COD
                topicKeywords.put("payment_cod", new String[] {
                                "COD", "tiền mặt", "thanh toán tại chỗ", "cash", "thanh toán sau",
                                "thanh toán khi nhận", "cash on delivery", "trả tiền mặt", "trả sau", "tiền mặt"
                });

                // Từ khóa cho chu kỳ kinh nguyệt
                topicKeywords.put("menstrual-cycle", new String[] {
                                "chu kỳ", "kinh nguyệt", "ngày an toàn", "rụng trứng", "period",
                                "tính ngày", "dự đoán", "kinh nguyệt không đều", "theo dõi chu kỳ",
                                "nhắc nhở chu kỳ", "ngày an toàn", "ngày nguy hiểm", "kỳ kinh"
                });

                // Từ khóa cho blog
                topicKeywords.put("blog", new String[] {
                                "blog", "bài viết", "chia sẻ", "kiến thức", "thông tin",
                                "đọc", "tác giả", "bài báo", "article", "health tips"
                });

                // Từ khóa cho hỏi đáp
                topicKeywords.put("questions", new String[] {
                                "câu hỏi", "hỏi đáp", "giải đáp", "thắc mắc", "FAQs",
                                "trả lời", "hỏi", "Q&A", "chuyên gia trả lời", "hỏi bác sĩ"
                });

                // Từ khóa cho đánh giá
                topicKeywords.put("rating", new String[] {
                                "đánh giá", "review", "rating", "nhận xét", "feedback",
                                "sao", "stars", "phản hồi", "comment", "bình luận"
                });
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
                                "tiền về", "qr code", "qr", "mã qr", "quét mã", "ngân hàng", "app ngân hàng",
                                "thanh toán nhanh", "thanh toán điện tử", "banking app", "mobile banking" });
                topicKeywords.put("menstrual-cycle", new String[] {
                                "chu kỳ kinh nguyệt", "chu kì kinh nguyệt", "kinh nguyệt", "ngày đèn đỏ", "hành kinh",
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