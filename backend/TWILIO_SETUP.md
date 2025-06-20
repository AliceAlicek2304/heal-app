# Twilio SMS Setup Guide

## Tại sao chọn Twilio?
- TextBelt đã tắt SMS miễn phí cho Việt Nam do lạm dụng
- Twilio cung cấp $15 credit miễn phí khi đăng ký
- Đáng tin cậy và có tỷ lệ gửi tin nhắn cao
- Hỗ trợ SMS toàn cầu bao gồm Việt Nam

## Cách setup Twilio miễn phí:

### Bước 1: Đăng ký tài khoản
1. Truy cập: https://www.twilio.com/try-twilio
2. Đăng ký tài khoản miễn phí
3. Xác thực số điện thoại của bạn
4. Nhận $15 credit miễn phí

### Bước 2: Lấy thông tin cấu hình
1. Đăng nhập vào Twilio Console
2. Tại Dashboard, copy:
   - **Account SID**
   - **Auth Token**
3. Vào Phone Numbers > Manage > Active numbers
4. Copy **Phone Number** (format: +1234567890)

### Bước 3: Cấu hình trong application.properties
```properties
# SMS Configuration
sms.enabled=true
sms.provider=twilio

# Twilio Configuration
twilio.account.sid=ACxxxxxxxxxxxxxxxxxx
twilio.auth.token=your_auth_token_here
twilio.phone.number=+1234567890
```

### Bước 4: Test SMS
- Restart ứng dụng
- Thử gửi mã xác thực qua API
- Kiểm tra log để xem kết quả

## Chi phí:
- **Miễn phí**: $15 credit (khoảng 150-300 SMS tùy vùng)
- **Việt Nam**: ~$0.05-0.10 per SMS
- **Quốc tế**: Xem bảng giá tại https://www.twilio.com/sms/pricing

## Lưu ý:
- Tài khoản trial chỉ gửi được đến số đã xác thực
- Để gửi đến bất kỳ số nào, cần upgrade account (không mất phí, chỉ cần thêm thẻ tín dụng)
- Credit $15 không hết hạn và đủ dùng cho development

## Troubleshooting:
- Nếu gặp lỗi "Unverified number", cần xác thực số điện thoại đích trong Twilio Console
- Nếu gặp lỗi credentials, kiểm tra lại Account SID và Auth Token
