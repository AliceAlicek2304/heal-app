# PHÂN TÍCH DỰ ÁN HEALAPP

## 1. TỔNG QUAN DỰ ÁN

HealApp là một ứng dụng chăm sóc sức khỏe toàn diện, đặc biệt tập trung vào sức khỏe sinh sản nữ. Dự án được xây dựng theo kiến trúc microservices với:

- **Backend**: Java Spring Boot 3.4.5 với Java 24
- **Frontend**: React 19.1.0 với Router DOM
- **Database**: SQL Server
- **Deployment**: Hỗ trợ Docker và Google Cloud Platform

## 2. CÔNG NGHỆ VÀ TÍCH HỢP

### 2.1 Backend Technology Stack
- **Framework**: Spring Boot 3.4.5
- **Security**: Spring Security + JWT Authentication
- **Database**: SQL Server với JPA/Hibernate
- **Payment**: Stripe Integration
- **SMS**: Twilio SMS Service
- **Email**: SendGrid SMTP
- **Storage**: Local storage + Google Cloud Storage
- **AI**: Google Gemini API integration
- **Banking**: MB Bank API integration

### 2.2 Frontend Technology Stack
- **Framework**: React 19.1.0
- **Routing**: React Router DOM 7.6.0
- **HTTP Client**: Axios
- **UI Components**: Custom CSS modules
- **Charts**: Recharts
- **PDF Generation**: jsPDF + jsPDF-autotable
- **Excel Export**: XLSX
- **Date Handling**: React DatePicker, date-fns

## 3. CẤU TRÚC DỮ LIỆU CHÍNH

### 3.1 User Management
- **UserDtls**: Quản lý thông tin người dùng với roles (ADMIN, USER, CONSULTANT, STAFF)
- **Role**: Hệ thống phân quyền
- **Gender**: Enum quản lý giới tính

### 3.2 Healthcare Core Entities
- **MenstrualCycle**: Theo dõi chu kỳ kinh nguyệt với AI analysis
- **STITest**: Quản lý xét nghiệm STI
- **STIService**: Các dịch vụ xét nghiệm
- **STIPackage**: Gói xét nghiệm combo
- **Consultation**: Tư vấn với chuyên gia
- **TestResult**: Kết quả xét nghiệm
- **TestConclusion**: Kết luận chẩn đoán

### 3.3 Content Management
- **BlogPost**: Hệ thống blog với approval workflow
- **BlogSection**: Sections của blog posts
- **Category**: Phân loại nội dung
- **Question**: Hệ thống hỏi đáp

### 3.4 Rating & Review System
- **Rating**: Đánh giá cho consultants và services
- **RatingSummary**: Tổng hợp đánh giá

### 3.5 Payment System
- **Payment**: Quản lý thanh toán đa phương thức (Stripe, QR Code, COD)
- Hỗ trợ refund và tracking

## 4. CÁC MODULE CHỨC NĂNG CHÍNH

### 4.1 Authentication & Authorization
**Luồng hoạt động:**
- Đăng ký/Đăng nhập với JWT tokens
- Xác thực email và SMS
- Quên mật khẩu với email reset
- Multi-role system (Admin, User, Consultant, Staff)

**Files liên quan:**
- `AuthController.java`
- `UserService.java`
- `AuthContext.js`

### 4.2 Menstrual Cycle Tracking & AI Analysis
**Luồng hoạt động:**
1. User nhập thông tin chu kỳ kinh nguyệt
2. Hệ thống tính toán chu kỳ, ngày rụng trứng
3. AI phân tích và đưa ra khuyến nghị
4. Reminder system cho chu kỳ tiếp theo

**Files liên quan:**
- `MenstrualCycleController.java`
- `MenstrualCycleAIController.java`
- `MenstrualCycleAIAnalysisService.java`
- `MenstrualCycleCalculator.jsx`

### 4.3 STI Testing System
**Luồng hoạt động:**
1. User browse services/packages
2. Book appointment với payment
3. Staff xác nhận và thực hiện test
4. Consultant review và cung cấp kết quả
5. User nhận kết quả và có thể rating

**Files liên quan:**
- `STIController.java`
- `STIPackageController.java`
- `STITestService.java`
- `STITesting.jsx`

### 4.4 Consultation System
**Luồng hoạt động:**
1. User chọn consultant và time slot
2. Book consultation
3. Online meeting qua video call
4. Consultant ghi chú và follow-up
5. Rating system

**Files liên quan:**
- `ConsultationController.java`
- `ConsultationService.java`
- `Consultation.jsx`

### 4.5 Blog & Content Management
**Luồng hoạt động:**
1. Users/Consultants tạo blog posts
2. Admin review và approve
3. Content moderation với AI
4. Category management
5. Public viewing với SEO optimization

**Files liên quan:**
- `BlogPostController.java`
- `BlogPostService.java`
- `ContentModerationService.java`
- `Blog.jsx`, `CreateBlog.jsx`

### 4.6 Payment System
**Luồng hoạt động:**
1. Multi-payment methods: Stripe, QR Code, COD
2. QR code với MB Bank integration
3. Payment tracking và status updates
4. Refund processing
5. Banking transaction verification

**Files liên quan:**
- `PaymentController.java`
- `PaymentService.java`
- `StripeService.java`
- `BankingService.java`

### 4.7 Rating & Review System
**Luồng hoạt động:**
1. User rating sau khi sử dụng service/consultation
2. Comment system
3. Staff reply to ratings
4. Rating aggregation và statistics
5. Public rating display

**Files liên quan:**
- `RatingController.java`
- `RatingService.java`
- `AllRatings.jsx`

### 4.8 Admin Dashboard
**Luồng hoạt động:**
1. Comprehensive analytics dashboard
2. User management (create, update, reset passwords)
3. Content moderation (blog approval, Q&A management)
4. Service management (STI services, packages)
5. Rating management
6. System configuration

**Files liên quan:**
- `AdminController.java`
- `AdminStatsService.java`
- `AdminDashboard.jsx`

### 4.9 AI Assistant
**Luồng hoạt động:**
1. Chatbot integration với Google Gemini
2. Medical knowledge base
3. Context-aware responses
4. Chat history tracking
5. Content moderation for safety

**Files liên quan:**
- `AIAssistantController.java`
- `AIAssistantService.java`
- `AIKnowledgeService.java`
- `ChatBot.jsx`

## 5. API ENDPOINTS CHÍNH

### 5.1 Authentication APIs
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/forgot-password` - Password reset

### 5.2 User Management APIs
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password

### 5.3 Menstrual Cycle APIs
- `POST /api/menstrual-cycle` - Add cycle data
- `GET /api/menstrual-cycle` - Get cycle history
- `POST /api/menstrual-cycle/ai-analysis` - AI analysis

### 5.4 STI Testing APIs
- `GET /api/sti/services` - List STI services
- `GET /api/sti/packages` - List STI packages
- `POST /api/sti/book` - Book STI test
- `GET /api/sti/tests` - Get user's tests

### 5.5 Consultation APIs
- `GET /api/consultations/consultants` - List consultants
- `POST /api/consultations/book` - Book consultation
- `GET /api/consultations` - Get consultations

### 5.6 Blog APIs
- `GET /api/blog/posts` - List blog posts
- `POST /api/blog/posts` - Create blog post
- `PUT /api/blog/posts/{id}` - Update blog post
- `GET /api/blog/categories` - Get categories

### 5.7 Payment APIs
- `POST /api/payments/create-intent` - Create Stripe payment
- `POST /api/payments/qr` - Generate QR payment
- `POST /api/payments/verify` - Verify payment

### 5.8 Rating APIs
- `POST /api/ratings` - Create rating
- `GET /api/ratings` - Get ratings
- `PUT /api/ratings/{id}/reply` - Staff reply

## 6. SECURITY & COMPLIANCE

### 6.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption với BCrypt
- Email và SMS verification

### 6.2 Data Protection
- Input validation và sanitization
- SQL injection protection với JPA
- XSS protection
- CORS configuration

### 6.3 Privacy & Compliance
- GDPR compliance considerations
- Medical data protection
- Audit trails cho sensitive operations

## 7. DEPLOYMENT & INFRASTRUCTURE

### 7.1 Local Development
- Docker support
- SQL Server local instance
- Environment-based configuration

### 7.2 Cloud Deployment
- Google Cloud Platform ready
- Cloud SQL support
- Google Cloud Storage integration
- Environment variables management

### 7.3 CI/CD
- GitHub Actions support (frontend)
- Maven build automation
- Docker containerization

## 8. BUSINESS LOGIC & WORKFLOWS

### 8.1 User Journey - STI Testing
1. **Discovery**: User browse STI services/packages
2. **Selection**: Choose service hoặc package
3. **Booking**: Select appointment time và payment method
4. **Payment**: Complete payment (Stripe/QR/COD)
5. **Confirmation**: Staff confirm appointment
6. **Testing**: Physical test execution
7. **Results**: Consultant review và provide results
8. **Follow-up**: User rating và potential consultation

### 8.2 User Journey - Menstrual Tracking
1. **Onboarding**: Input initial menstrual data
2. **Tracking**: Regular cycle input
3. **Analysis**: AI-powered insights và predictions
4. **Notifications**: Reminder system
5. **Consultation**: Optional expert consultation

### 8.3 User Journey - Content Consumption
1. **Browse**: Explore blog posts và Q&A
2. **Search**: Find relevant content
3. **Engage**: Read, comment, ask questions
4. **Create**: Contribute content (for verified users)

### 8.4 Admin Workflow
1. **Monitoring**: Dashboard analytics
2. **Moderation**: Content approval
3. **Management**: User và service management
4. **Support**: Handle user issues
5. **Configuration**: System settings

## 9. KẾT LUẬN

HealApp là một hệ thống chăm sóc sức khỏe toàn diện với:

**Điểm mạnh:**
- Architecture hiện đại với Spring Boot và React
- Tích hợp AI cho medical insights
- Multi-payment system comprehensive
- Role-based security robust
- Responsive design với mobile support

**Phạm vi ứng dụng:**
- Sức khỏe sinh sản nữ
- STI testing và consultation
- Medical content platform
- Telemedicine services

**Scalability:**
- Cloud-ready architecture
- Microservices design patterns
- Database optimization với indexing
- Caching strategies

Dự án thể hiện sự hiểu biết sâu sắc về domain healthcare và requirements phức tạp của medical applications, với focus đặc biệt vào user experience và data security.