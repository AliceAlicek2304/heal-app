package com.healapp.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.healapp.model.Consultation;
import com.healapp.model.UserDtls;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String from;

    public void sendPasswordResetCode(String to, String code) throws MessagingException {
        MimeMessage message = createResetPasswordMessage(to, code);
        mailSender.send(message);
    }

    @Async("asyncExecutor")
    public void sendPasswordResetCodeAsync(String to, String code) {
        try {
            MimeMessage message = createResetPasswordMessage(to, code);
            mailSender.send(message);
            logger.info("Password reset email sent successfully to: {}", to);
        } catch (MessagingException e) {
            logger.error("Failed to send password reset email to {}: {}", to, e.getMessage());
        }
    }

    private MimeMessage createResetPasswordMessage(String to, String code) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("Password Reset Verification Code");

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Password Reset</h2>"
                + "<p>You have requested to reset your password. Please use the following verification code:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; "
                + "text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;'>"
                + code
                + "</div>"
                + "<p>This code will expire in 15 minutes.</p>"
                + "<p>If you did not request a password reset, please ignore this email.</p>"
                + "<p>Best regards,<br/>Heal App Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);

        return message;
    }

    public void sendConsultationConfirmation(Consultation consultation) throws MessagingException {
        sendEmailToCustomer(consultation);

        sendEmailToStaff(consultation);
    }

    @Async("asyncExecutor")
    public void sendConsultationConfirmationAsync(Consultation consultation) {
        try {
            sendConsultationConfirmation(consultation);
            logger.info("Consultation confirmation emails sent successfully for consultation ID: {}",
                    consultation.getConsultationId());
        } catch (MessagingException e) {
            logger.error("Failed to send consultation confirmation emails for consultation ID {}: {}",
                    consultation.getConsultationId(), e.getMessage());
        }
    }

    private void sendEmailToCustomer(Consultation consultation) throws MessagingException {
        UserDtls customer = consultation.getCustomer();
        UserDtls staff = consultation.getConsultant();

        String subject = "Xác nhận cuộc tư vấn #" + consultation.getConsultationId();

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Xác nhận cuộc tư vấn</h2>"
                + "<p>Xin chào " + customer.getFullName() + ",</p>"
                + "<p>Cuộc tư vấn của bạn đã được xác nhận với các thông tin sau:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>"
                + "<p><strong>Mã cuộc tư vấn:</strong> #" + consultation.getConsultationId() + "</p>"
                + "<p><strong>Nhân viên tư vấn:</strong> " + staff.getFullName() + "</p>"
                + "<p><strong>Ngày tư vấn:</strong> " + consultation.getStartTime().format(DATE_FORMATTER) + "</p>"
                + "<p><strong>Thời gian:</strong> " + consultation.getStartTime().format(TIME_FORMATTER)
                + " - " + consultation.getEndTime().format(TIME_FORMATTER) + "</p>"
                + "</div>"
                + "<p>Vui lòng tham gia cuộc tư vấn trực tuyến qua link Jitsi Meet sau:</p>"
                + "<p><a href=\"" + consultation.getMeetUrl() + "\" style='display: inline-block; "
                + "background-color: #4a6ee0; color: white; padding: 10px 20px; text-decoration: none; "
                + "border-radius: 5px; font-weight: bold;'>Tham gia cuộc họp</a></p>"
                + "<p><small>Hoặc copy link sau: " + consultation.getMeetUrl() + "</small></p>"
                + "<h3>Hướng dẫn sử dụng Jitsi Meet:</h3>"
                + "<ol>"
                + "<li>Nhấn vào đường link trên vào đúng thời gian hẹn</li>"
                + "<li>Cho phép trình duyệt truy cập camera và microphone</li>"
                + "<li>Nhập tên của bạn và tham gia cuộc họp</li>"
                + "</ol>"
                + "<p>Nếu bạn cần hỗ trợ, vui lòng liên hệ chúng tôi qua email hoặc số điện thoại.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        sendEmail(customer.getEmail(), subject, htmlContent);
    }

    private void sendEmailToStaff(Consultation consultation) throws MessagingException {
        UserDtls customer = consultation.getCustomer();
        UserDtls consultant = consultation.getConsultant();

        String subject = "Xác nhận cuộc tư vấn với khách hàng #" + consultation.getConsultationId();

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Thông tin cuộc tư vấn</h2>"
                + "<p>Xin chào " + consultant.getFullName() + ",</p>"
                + "<p>Bạn có một cuộc tư vấn đã được xác nhận với khách hàng:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>"
                + "<p><strong>Mã cuộc tư vấn:</strong> #" + consultation.getConsultationId() + "</p>"
                + "<p><strong>Khách hàng:</strong> " + customer.getFullName() + "</p>"
                + "<p><strong>Email khách hàng:</strong> " + customer.getEmail() + "</p>"
                + "<p><strong>Ngày tư vấn:</strong> " + consultation.getStartTime().format(DATE_FORMATTER) + "</p>"
                + "<p><strong>Thời gian:</strong> " + consultation.getStartTime().format(TIME_FORMATTER)
                + " - " + consultation.getEndTime().format(TIME_FORMATTER) + "</p>"
                + "</div>"
                + "<p>Link Jitsi Meet để tư vấn:</p>"
                + "<p><a href=\"" + consultation.getMeetUrl() + "\" style='display: inline-block; "
                + "background-color: #4a6ee0; color: white; padding: 10px 20px; text-decoration: none; "
                + "border-radius: 5px; font-weight: bold;'>Tham gia cuộc họp</a></p>"
                + "<p><small>Hoặc copy link sau: " + consultation.getMeetUrl() + "</small></p>"
                + "<p>Vui lòng chuẩn bị và có mặt đúng giờ để đảm bảo chất lượng dịch vụ.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        sendEmail(consultant.getEmail(), subject, htmlContent);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.format(DATETIME_FORMATTER);
    }

    private MimeMessage createEmailVerificationMessage(String to, String code) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("Xác thực email - HealApp");

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Xác thực địa chỉ email</h2>"
                + "<p>Cảm ơn bạn đã đăng ký tài khoản tại HealApp. Để hoàn tất quá trình đăng ký, vui lòng nhập mã xác thực sau:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; "
                + "text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;'>"
                + code
                + "</div>"
                + "<p>Mã xác thực có hiệu lực trong vòng 10 phút.</p>"
                + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);

        return message;
    }

    public void sendEmailVerificationCode(String to, String code) throws MessagingException {
        MimeMessage message = createEmailVerificationMessage(to, code);
        mailSender.send(message);
    }

    @Async("asyncExecutor")
    public void sendEmailVerificationCodeAsync(String to, String code) {
        try {
            MimeMessage message = createEmailVerificationMessage(to, code);
            mailSender.send(message);
            logger.info("Email verification code sent successfully to {}", to);
        } catch (MessagingException e) {
            logger.error("Failed to send email verification code to {}: {}", to, e.getMessage());
        }
    }

    @Async("asyncExecutor")
    public void sendEmailUpdateVerificationAsync(String newEmail, String code, String fullName) {
        try {
            MimeMessage message = createEmailUpdateVerificationMessage(newEmail, code, fullName);
            mailSender.send(message);
            logger.info("Email update verification code sent successfully to: {}", newEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send email update verification code to {}: {}", newEmail, e.getMessage());
        }
    }

    @Async("asyncExecutor")
    public void sendEmailChangeNotificationAsync(String oldEmail, String newEmail, String fullName) {
        try {
            MimeMessage message = createEmailChangeNotificationMessage(oldEmail, newEmail, fullName);
            mailSender.send(message);
            logger.info("Email change notification sent successfully to: {}", oldEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send email change notification to {}: {}", oldEmail, e.getMessage());
        }
    }

    @Async("asyncExecutor")
    public void sendEmailChangeConfirmationAsync(String newEmail, String fullName) {
        try {
            MimeMessage message = createEmailChangeConfirmationMessage(newEmail, fullName);
            mailSender.send(message);
            logger.info("Email change confirmation sent successfully to: {}", newEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send email change confirmation to {}: {}", newEmail, e.getMessage());
        }
    }

    @Async("asyncExecutor")
    public void sendPasswordChangeNotificationAsync(String email, String fullName) {
        try {
            MimeMessage message = createPasswordChangeNotificationMessage(email, fullName);
            mailSender.send(message);
            logger.info("Password change notification sent successfully to: {}", email);
        } catch (MessagingException e) {
            logger.error("Failed to send password change notification to {}: {}", email, e.getMessage());
        }
    }

    @Async("asyncExecutor")
    public void sendOvulationReminderAsync(String email, String fullName, LocalDate ovulationDate) {
        try {
            MimeMessage message = createOvulationReminderMessage(email, fullName, ovulationDate);
            mailSender.send(message);
            logger.info("Email nhắc nhở ngày rụng trứng đã được gửi thành công đến: {}", email);
        } catch (MessagingException e) {
            logger.error("Không thể gửi email nhắc nhở ngày rụng trứng đến {}: {}", email, e.getMessage());
        }
    }

    private MimeMessage createOvulationReminderMessage(String to, String fullName, LocalDate ovulationDate)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("Nhắc nhở ngày rụng trứng - HealApp");

        String dateFormatted = ovulationDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #ff69b4;'>Nhắc nhở ngày rụng trứng</h2>"
                + "<p>Xin chào " + fullName + ",</p>"
                + "<p>Chúng tôi gửi email này để nhắc bạn rằng <strong>ngày mai (" + dateFormatted
                + ")</strong> là ngày rụng trứng theo chu kỳ kinh nguyệt bạn đã theo dõi trên HealApp.</p>"
                + "<div style='background-color: #fff0f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>"
                + "<p><strong>Thông tin:</strong></p>"
                + "<p>Ngày rụng trứng: " + dateFormatted + "</p>"
                + "<p>Đây là thời điểm quan trọng trong chu kỳ kinh nguyệt của bạn, là lúc cơ hội mang thai cao nhất nếu bạn đang có kế hoạch.</p>"
                + "</div>"
                + "<p>Để biết thêm thông tin chi tiết về chu kỳ kinh nguyệt và sức khỏe sinh sản, bạn có thể truy cập HealApp hoặc tham khảo ý kiến từ các chuyên gia y tế của chúng tôi.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);
        return message;
    }

    private MimeMessage createEmailUpdateVerificationMessage(String to, String code, String fullName)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("Xác thực email mới - HealApp");

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Xác thực địa chỉ email mới</h2>"
                + "<p>Xin chào " + fullName + ",</p>"
                + "<p>Bạn đã yêu cầu thay đổi địa chỉ email cho tài khoản HealApp của mình. Để xác nhận địa chỉ email mới, vui lòng nhập mã xác thực sau:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; "
                + "text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;'>"
                + code
                + "</div>"
                + "<p>Mã xác thực có hiệu lực trong vòng 10 phút.</p>"
                + "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và địa chỉ email của bạn sẽ không thay đổi.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);
        return message;
    }

    private MimeMessage createEmailChangeNotificationMessage(String oldEmail, String newEmail, String fullName)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(oldEmail);
        helper.setSubject("Thông báo thay đổi email - HealApp");

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Thông báo thay đổi email</h2>"
                + "<p>Xin chào " + fullName + ",</p>"
                + "<p>Địa chỉ email cho tài khoản HealApp của bạn đã được thay đổi thành công.</p>"
                + "<p><strong>Email cũ:</strong> " + oldEmail + "</p>"
                + "<p><strong>Email mới:</strong> " + newEmail + "</p>"
                + "<p>Từ bây giờ, bạn sẽ cần sử dụng email mới để đăng nhập vào tài khoản.</p>"
                + "<p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);
        return message;
    }

    private MimeMessage createEmailChangeConfirmationMessage(String newEmail, String fullName)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(newEmail);
        helper.setSubject("Chào mừng đến với HealApp - Email đã được cập nhật");

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Email đã được cập nhật thành công</h2>"
                + "<p>Xin chào " + fullName + ",</p>"
                + "<p>Địa chỉ email cho tài khoản HealApp của bạn đã được cập nhật thành công sang: <strong>" + newEmail
                + "</strong></p>"
                + "<p>Từ bây giờ, bạn có thể sử dụng địa chỉ email này để:</p>"
                + "<ul>"
                + "<li>Đăng nhập vào tài khoản HealApp</li>"
                + "<li>Nhận các thông báo và cập nhật từ hệ thống</li>"
                + "<li>Khôi phục mật khẩu nếu cần</li>"
                + "</ul>"
                + "<p>Cảm ơn bạn đã sử dụng HealApp!</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);
        return message;
    }

    private MimeMessage createPasswordChangeNotificationMessage(String email, String fullName)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(email);
        helper.setSubject("Thông báo thay đổi mật khẩu - HealApp");

        String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Mật khẩu đã được thay đổi</h2>"
                + "<p>Xin chào " + fullName + ",</p>"
                + "<p>Mật khẩu cho tài khoản HealApp của bạn đã được thay đổi thành công vào lúc: <strong>"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) + "</strong></p>"
                + "<p>Nếu bạn không thực hiện thay đổi này, vui lòng:</p>"
                + "<ol>"
                + "<li>Liên hệ với chúng tôi ngay lập tức</li>"
                + "<li>Đặt lại mật khẩu của bạn</li>"
                + "<li>Kiểm tra bảo mật tài khoản</li>"
                + "</ol>"
                + "<p>Để đảm bảo an toàn, chúng tôi khuyến nghị bạn:</p>"
                + "<ul>"
                + "<li>Sử dụng mật khẩu mạnh và duy nhất</li>"
                + "<li>Không chia sẻ mật khẩu với bất kỳ ai</li>"
                + "<li>Thay đổi mật khẩu định kỳ</li>"
                + "</ul>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";

        helper.setText(htmlContent, true);
        return message;
    }

    @Async
    public void sendConsultantDeactivatedNotificationAsync(String email, String fullName) {
        try {
            String subject = "Account Deactivated - HealApp Consultant";
            String body = String.format("""
                    Dear %s,

                    Your consultant account has been deactivated by the administrator.

                    Your account is temporarily disabled. Please contact support if you have any questions.

                    Best regards,
                    HealApp Administration Team
                    """, fullName);

            sendEmail(email, subject, body);
        } catch (Exception e) {
        }
    }

    @Async
    public void sendConsultantActivatedNotificationAsync(String email, String fullName) {
        try {
            String subject = "Account Reactivated - HealApp Consultant";
            String body = String.format("""
                    Dear %s,

                    Your consultant account has been reactivated by the administrator.

                    You can now log in and resume your consultant activities.

                    Best regards,
                    HealApp Administration Team
                    """, fullName);

            sendEmail(email, subject, body);
        } catch (Exception e) {
        }
    }

    @Async
    public void sendConsultantRoleRemovedNotificationAsync(String email, String fullName) {
        try {
            String subject = "Consultant Role Removed - HealApp";
            String body = String.format("""
                    Dear %s,

                    Your consultant role has been removed by the administrator.

                    Your account has been converted to a regular customer account.

                    Best regards,
                    HealApp Administration Team
                    """, fullName);

            sendEmail(email, subject, body);
        } catch (Exception e) {
        }
    }

    @Async("asyncExecutor")
    public void sendConsultationReminderAsync(Consultation consultation) {
        try {
            UserDtls customer = consultation.getCustomer();
            UserDtls consultant = consultation.getConsultant();
            String subject = "[Nhắc nhở] Bạn có lịch tư vấn vào ngày mai - HealApp";
            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Nhắc nhở lịch tư vấn</h2>"
                + "<p>Xin chào " + customer.getFullName() + ",</p>"
                + "<p>Đây là email nhắc nhở bạn có một cuộc tư vấn đã được xác nhận sẽ diễn ra vào <strong>ngày mai</strong>:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>"
                + "<p><strong>Nhân viên tư vấn:</strong> " + consultant.getFullName() + "</p>"
                + "<p><strong>Ngày tư vấn:</strong> " + consultation.getStartTime().format(DATE_FORMATTER) + "</p>"
                + "<p><strong>Thời gian:</strong> " + consultation.getStartTime().format(TIME_FORMATTER)
                + " - " + consultation.getEndTime().format(TIME_FORMATTER) + "</p>"
                + "</div>"
                + (consultation.getMeetUrl() != null ? "<p>Tham gia tư vấn trực tuyến qua link: <a href='" + consultation.getMeetUrl() + "'>" + consultation.getMeetUrl() + "</a></p>" : "")
                + "<p>Vui lòng chuẩn bị và tham gia đúng giờ để đảm bảo chất lượng dịch vụ.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";
            sendEmail(customer.getEmail(), subject, htmlContent);
        } catch (Exception e) {
            logger.error("Lỗi khi gửi email nhắc nhở lịch tư vấn: {}", e.getMessage(), e);
        }
    }

    @Async("asyncExecutor")
    public void sendSTITestReminderAsync(String email, String fullName, String serviceName, String packageName, LocalDateTime appointmentDate) {
        try {
            String subject = "[Nhắc nhở] Bạn có lịch xét nghiệm STI vào ngày mai - HealApp";
            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #4a6ee0;'>Nhắc nhở lịch xét nghiệm STI</h2>"
                + "<p>Xin chào " + fullName + ",</p>"
                + "<p>Đây là email nhắc nhở bạn có một lịch xét nghiệm STI đã được xác nhận sẽ diễn ra vào <strong>ngày mai</strong>:</p>"
                + "<div style='background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;'>"
                + (serviceName != null ? "<p><strong>Dịch vụ:</strong> " + serviceName + "</p>" : "")
                + (packageName != null ? "<p><strong>Gói xét nghiệm:</strong> " + packageName + "</p>" : "")
                + "<p><strong>Ngày xét nghiệm:</strong> " + appointmentDate.format(DATE_FORMATTER) + "</p>"
                + "<p><strong>Thời gian:</strong> " + appointmentDate.format(TIME_FORMATTER) + "</p>"
                + "</div>"
                + "<p>Vui lòng đến đúng giờ để đảm bảo quy trình xét nghiệm diễn ra thuận lợi.</p>"
                + "<p>Trân trọng,<br/>HealApp Team</p>"
                + "</div>";
            sendEmail(email, subject, htmlContent);
        } catch (Exception e) {
            logger.error("Lỗi khi gửi email nhắc nhở lịch xét nghiệm STI: {}", e.getMessage(), e);
        }
    }

    private void sendEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }
}
