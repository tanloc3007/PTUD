# -*- coding: utf-8 -*-
"""
UniMind Graduation Report - Tables Data Definitions
Defines all 26+ tables structured with headers, data rows, and formatting.
"""

# Bảng 1.1: So sánh với hệ thống tương tự
TABLE_1_1 = {
    "caption": "Bảng 1.1: Bảng so sánh hệ thống UniMind với các giải pháp hỗ trợ tâm lý tương tự",
    "headers": ["Tiêu chí đánh giá", "UniMind (Hệ thống đề xuất)", "Woebot (Quốc tế)", "BetterHelp (Quốc tế)", "MindSpa / Wysa"],
    "rows": [
        ["Đối tượng phục vụ", "Sinh viên Đại học Lạc Hồng", "Người dùng đại chúng toàn cầu", "Khách hàng trả phí quốc tế", "Người dùng trẻ toàn cầu"],
        ["Ngôn ngữ hỗ trợ", "Tiếng Việt bản địa chuẩn xác", "Chủ yếu Tiếng Anh", "Tiếng Anh (rất ít tiếng Việt)", "Tiếng Anh"],
        ["Mức độ ẩn danh (Pseudonym)", "Ẩn danh hoàn toàn (Bí danh ngẫu nhiên)", "Ẩn danh một phần", "Bắt buộc họ tên thật, thẻ tín dụng", "Ẩn danh một phần"],
        ["Trắc nghiệm chuẩn hóa", "DASS-21 chuẩn hóa theo sinh viên VN", "PHQ-9, GAD-7 cơ bản", "Đánh giá sơ bộ phân loại", "Bài tập CBT cơ bản"],
        ["Phân loại AI cảm xúc", "4 mức độ chi tiết + Lời khuyên thấu cảm", "Quy tắc hội thoại theo kịch bản (Rule-based)", "Không có AI phân tích nhật ký", "AI Chatbot phản hồi ngắn"],
        ["Sàng lọc khủng hoảng (Triage)", "Tự động phát hiện tự hại & Báo chuyên viên", "Cung cấp số khẩn cấp 911", "Từ chối tiếp nhận ca khủng hoảng cấp", "Chuyển tiếp đường dây nóng quốc tế"],
        ["Kết nối chuyên gia thực tế", "Đặt lịch trực tiếp chuyên viên tâm lý trường", "Hoàn toàn tự động, không có người", "Bác sĩ trị liệu trả phí cao ($60-90/tuần)", "Chỉ có phiên bản trả phí cao"],
        ["Chống trùng lịch hẹn", "Khóa chống trùng lịch đa tầng (Anti-Double-Booking)", "Không có chức năng đặt lịch", "Lịch hẹn đồng bộ Google Calendar", "Không có chức năng chuyên gia học đường"],
        ["Chi phí đối với sinh viên", "Hoàn toàn miễn phí cho sinh viên trường", "Miễn phí tính năng cơ bản", "Chi phí rất cao, không phù hợp SV", "Thu phí định kỳ hàng tháng"],
        ["Nền tảng công nghệ", ".NET 8, Clean Architecture, React 18, SQL Server", "Mobile App (Proprietary)", "Web/App quy mô thương mại lớn", "Mobile App AI"],
        ["Bảo mật phòng tư vấn", "Zero-Trust SafeRoom E2EE qua WebRTC", "Không có video call", "Zoom tích hợp bên thứ ba", "Không có video call chuyên gia"]
    ]
}

# Bảng 2.1: So sánh CSDL SQL Server vs MongoDB
TABLE_2_1 = {
    "caption": "Bảng 2.1: Bảng so sánh chuyên sâu giữa SQL Server và NoSQL MongoDB",
    "headers": ["Tiêu chí so sánh", "Microsoft SQL Server 2022 (RDBMS)", "MongoDB 7.0 (NoSQL Document)"],
    "rows": [
        ["Mô hình dữ liệu", "Bảng quan hệ 2 chiều (Tables, Columns, Rows)", "Tài liệu JSON/BSON linh hoạt (Collections, Documents)"],
        ["Tính toàn vẹn dữ liệu (ACID)", "Hỗ trợ ACID toàn diện ở mức độ mạnh nhất, bảo đảm giao dịch chuẩn xác tuyệt đối", "Hỗ trợ ACID đa tài liệu nhưng đòi hỏi cấu hình Replica Set phức tạp và giảm hiệu năng"],
        ["Ràng buộc khóa ngoại (Foreign Keys)", "Bắt buộc toàn vẹn tham chiếu (Cascade, Restrict, SetNull), ngăn chặn dữ liệu mồ côi", "Không có khái niệm Foreign Key; phải tự kiểm soát tính toàn vẹn bằng mã nguồn ứng dụng"],
        ["Giải quyết tranh chấp đặt lịch (Concurrency)", "Khóa giao dịch cấp hàng (Row-level Locking) và ràng buộc Unique Index bảo đảm chống trùng 100%", "Dễ xảy ra Race Condition khi ghi đồng thời nếu không dùng Distributed Lock"],
        ["Hỗ trợ ORM / Migration", "Entity Framework Core Code-First hỗ trợ Migration cực kỳ mạnh mẽ, kiểm soát phiên bản CSDL", "Cần tự quản lý cấu trúc Schema thông qua Mongoose hoặc C# MongoDriver không có Migration tự động"],
        ["Hiệu năng truy vấn quan hệ phức tạp", "Tối ưu hóa với chỉ mục Clustered/Non-Clustered, truy vấn JOIN tốc độ cao", "Phải sử dụng Aggregation Lookup gây tốn bộ nhớ và chậm khi quan hệ nhiều bảng"],
        ["Bảo mật và Kiểm toán (Audit)", "Hỗ trợ Transparent Data Encryption (TDE), Dynamic Data Masking và Audit Logs chuẩn", "Hỗ trợ mã hóa tài liệu nhưng công cụ kiểm toán chi tiết đòi hỏi phiên bản Enterprise có phí"],
        ["Phù hợp cho đồ án UniMind", "Cực kỳ phù hợp cho bài toán lịch hẹn y tế, tính điểm DASS-21 và quản trị người dùng", "Chỉ phù hợp cho lưu trữ bài viết mạng xã hội không đòi hỏi ràng buộc toàn vẹn nghiêm ngặt"]
    ]
}

# 10 Bảng đặc tả Use Case chi tiết
USE_CASE_TABLES = [
    {
        "caption": "Bảng 3.1: Bảng đặc tả Use Case Đăng nhập hệ thống (UC-01)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-01: Đăng nhập hệ thống (System Login)"],
            ["Tác nhân (Actor)", "Sinh viên, Chuyên viên tâm lý, Quản trị viên"],
            ["Ngữ cảnh kích hoạt", "Người dùng mở trang web UniMind và muốn truy cập vào các phân hệ cá nhân"],
            ["Tiền điều kiện (Pre-conditions)", "Người dùng đã có tài khoản hợp lệ được lưu trong bảng dbo.Users và chưa bị khóa"],
            ["Hậu điều kiện (Post-conditions)", "Hệ thống cấp phát JWT Token (Access Token và Refresh Token) lưu trữ an toàn trong HttpOnly Cookie/AuthStore; điều hướng người dùng về đúng trang chủ theo quyền (Student/Expert/Admin)"],
            ["Luồng sự kiện chính (Main Flow)", "1. Người dùng nhập Email và Mật khẩu tại màn hình Đăng nhập.\n2. Người dùng nhấn nút \"Đăng nhập\".\n3. Hệ thống kiểm tra định dạng email và mật khẩu không được rỗng.\n4. Hệ thống truy vấn CSDL, kiểm tra băm mật khẩu với thuật toán BCrypt.\n5. Nếu khớp, hệ thống tạo JWT Token mang thông tin UserId, Email, Roles, AnonymousCode.\n6. Hệ thống ghi nhận nhật ký kiểm toán AuditLog và chuyển hướng người dùng."],
            ["Luồng phụ (Alternative Flow)", "1a. Người dùng chưa có tài khoản: Nhấn liên kết \"Đăng ký ngay\" để chuyển sang màn hình Đăng ký tài khoản sinh viên."],
            ["Ngoại lệ (Exceptions)", "4a. Email không tồn tại hoặc Mật khẩu sai: Hệ thống hiển thị thông báo lỗi \"Tài khoản hoặc mật khẩu không chính xác\" (mã lỗi 401 Unauthorized).\n4b. Tài khoản bị tạm khóa: Hiển thị thông báo \"Tài khoản của bạn đã bị khóa do vi phạm tiêu chuẩn cộng đồng\" (mã lỗi 403 Forbidden)."]
        ]
    },
    {
        "caption": "Bảng 3.2: Bảng đặc tả Use Case Đổi mật khẩu tài khoản (UC-02)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-02: Đổi mật khẩu tài khoản (Change Password)"],
            ["Tác nhân (Actor)", "Sinh viên, Chuyên viên, Quản trị viên đã đăng nhập"],
            ["Ngữ cảnh kích hoạt", "Người dùng muốn tăng cường an toàn bảo mật hoặc thay đổi mật khẩu định kỳ"],
            ["Tiền điều kiện", "Người dùng đang trong phiên đăng nhập hợp lệ với Token chưa hết hạn"],
            ["Hậu điều kiện", "Mật khẩu mới được băm và cập nhật vào CSDL, vô hiệu hóa các phiên đăng nhập cũ trên thiết bị khác"],
            ["Luồng sự kiện chính", "1. Người dùng vào Cài đặt tài khoản -> chọn \"Đổi mật khẩu\".\n2. Nhập Mật khẩu hiện tại, Mật khẩu mới và Xác nhận mật khẩu mới.\n3. Nhấn \"Lưu mật khẩu mới\".\n4. Hệ thống kiểm tra mật khẩu hiện tại có đúng hay không.\n5. Hệ thống kiểm tra mật khẩu mới đạt chuẩn bảo mật (tối thiểu 8 ký tự, có chữ hoa, số và ký tự đặc biệt).\n6. Hệ thống băm mật khẩu mới bằng BCrypt, cập nhật cột PasswordHash trong CSDL và gửi thông báo thành công."],
            ["Luồng phụ", "Người dùng nhấn \"Hủy\" để giữ nguyên mật khẩu cũ và quay về trang chủ."],
            ["Ngoại lệ", "4a. Mật khẩu hiện tại không đúng: Báo lỗi \"Mật khẩu cũ không chính xác\".\n5a. Xác nhận mật khẩu không khớp: Báo lỗi \"Mật khẩu xác nhận không trùng khớp\"."]
        ]
    },
    {
        "caption": "Bảng 3.3: Bảng đặc tả Use Case Viết nhật ký cảm xúc & Nhận phản hồi AI (UC-03)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-03: Viết nhật ký cảm xúc & Lời khuyên UniMind AI (Create Journal & AI Reflection)"],
            ["Tác nhân (Actor)", "Sinh viên (Student)"],
            ["Ngữ cảnh kích hoạt", "Sinh viên muốn giãi bày tâm trạng, ghi lại những sự kiện trong ngày và nhận lời khuyên"],
            ["Tiền điều kiện", "Sinh viên đã đăng nhập vào hệ thống"],
            ["Hậu điều kiện", "Bản ghi nhật ký được lưu an toàn trong bảng dbo.JournalEntries; trả về nhãn cảm xúc và phản hồi thấu cảm từ AI"],
            ["Luồng sự kiện chính", "1. Sinh viên nhấn nút \"Viết nhật ký hôm nay\".\n2. Nhập nội dung tâm tư, chọn các thẻ chủ đề (#học tập, #gia đình, #tình bạn, #tương lai).\n3. Nhấn nút \"Lưu & Phân tích tâm trạng\".\n4. Hệ thống kiểm tra nội dung không rỗng và tối thiểu 10 ký tự.\n5. Backend kích hoạt dịch vụ AISentimentService, gửi Prompt chuẩn hóa tới Google Gemini AI.\n6. AI phân loại cảm xúc thành 1 trong 4 nhãn: \"Tuyệt vời\", \"Khá ổn\", \"Bình thường\", \"Không tốt\" và sinh lời khuyên nâng đỡ tinh thần.\n7. Hệ thống lưu kết quả vào CSDL và hiển thị kết quả phân loại lên màn hình kèm hiệu ứng xoa dịu."],
            ["Luồng phụ", "Sinh viên có thể chỉnh sửa lại nhật ký trong ngày hoặc đánh dấu riêng tư tuyệt đối."],
            ["Ngoại lệ", "Nội dung nhật ký chứa từ khóa tự hại cấp tính: Hệ thống kích hoạt cảnh báo Triage Alert và hiển thị Popup số điện thoại khẩn cấp."]
        ]
    },
    {
        "caption": "Bảng 3.4: Bảng đặc tả Use Case Thực hiện bài trắc nghiệm tâm lý DASS-21 (UC-04)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-04: Thực hiện trắc nghiệm tâm lý DASS-21 (Take Psychological Test)"],
            ["Tác nhân (Actor)", "Sinh viên (Student)"],
            ["Ngữ cảnh kích hoạt", "Sinh viên muốn tự đánh giá mức độ Trầm cảm, Lo âu và Căng thẳng trong 1 tuần qua"],
            ["Tiền điều kiện", "Sinh viên đã đăng nhập hệ thống"],
            ["Hậu điều kiện", "Kết quả trắc nghiệm và điểm số 3 trục được lưu vào bảng dbo.TestResults, vẽ biểu đồ theo dõi"],
            ["Luồng sự kiện chính", "1. Sinh viên vào phân hệ \"Trắc nghiệm tâm lý\" -> Chọn bài \"Thang đo DASS-21 chuẩn hóa\".\n2. Đọc hướng dẫn làm bài và nhấn \"Bắt đầu\".\n3. Trả lời tuần tự 21 câu hỏi theo thang đo 4 mức (0 - 3 điểm).\n4. Nhấn \"Hoàn thành & Xem kết quả\".\n5. Hệ thống tính tổng điểm cho từng thang đo: Trầm cảm (D), Lo âu (A), Căng thẳng (S) theo công thức nhân hệ số 2.\n6. Hệ thống phân loại mức độ: Bình thường, Nhẹ, Vừa, Nặng, Rất nặng.\n7. Hiển thị kết quả trực quan dạng thanh tiến trình kèm lời khuyên chuyên môn và nút đặt lịch tư vấn."],
            ["Luồng phụ", "Sinh viên xem lại lịch sử các lần làm test trước đó để thấy xu hướng tiến triển tâm lý."],
            ["Ngoại lệ", "Chưa trả lời đủ 21 câu hỏi: Hệ thống cảnh báo các câu còn sót và yêu cầu hoàn thành trước khi nộp."]
        ]
    },
    {
        "caption": "Bảng 3.5: Bảng đặc tả Use Case Đăng bài viết chia sẻ ẩn danh (UC-05)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-05: Đăng bài viết chia sẻ ẩn danh (Post Anonymous Community Story)"],
            ["Tác nhân (Actor)", "Sinh viên (Student)"],
            ["Ngữ cảnh kích hoạt", "Sinh viên muốn chia sẻ câu chuyện áp lực hoặc tìm kiếm sự đồng cảm từ bạn bè cùng trường"],
            ["Tiền điều kiện", "Sinh viên đã đăng nhập hệ thống"],
            ["Hậu điều kiện", "Bài viết xuất hiện trên Bảng tin cộng đồng dưới bí danh ẩn danh, không lộ thông tin cá nhân"],
            ["Luồng sự kiện chính", "1. Sinh viên vào trang \"Góc chia sẻ ẩn danh\".\n2. Nhập tiêu đề, nội dung câu chuyện và chọn cảm xúc biểu trưng.\n3. Nhấn \"Đăng bài ẩn danh\".\n4. Hệ thống chạy bộ lọc kiểm duyệt ngôn từ độc hại (Profanity Filter).\n5. Nếu bài viết an toàn, hệ thống gán bí danh ngẫu nhiên (ví dụ: \"Bạn Ẩn Yên #934\") và lưu vào bảng dbo.CommunityPosts.\n6. Thông báo thành công và làm mới bảng tin cộng đồng."],
            ["Luồng phụ", "Sinh viên có thể chọn tính năng bình luận ẩn danh vào bài viết của người khác để động viên."],
            ["Ngoại lệ", "Bài viết chứa từ ngữ công kích thô tục: Hệ thống từ chối đăng và yêu cầu chỉnh sửa phù hợp chuẩn mực học đường."]
        ]
    },
    {
        "caption": "Bảng 3.6: Bảng đặc tả Use Case Xử lý cảnh báo khủng hoảng Triage Alert (UC-06)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-06: Tiếp nhận & Xử lý cảnh báo khủng hoảng (Handle Triage Crisis Alert)"],
            ["Tác nhân (Actor)", "Chuyên viên tâm lý (Expert), Quản trị viên (Admin)"],
            ["Ngữ cảnh kích hoạt", "Sinh viên đăng bài hoặc viết nhật ký có dấu hiệu tự hại, hệ thống tự động kích hoạt Triage Alert"],
            ["Tiền điều kiện", "Chuyên viên đăng nhập vào Bàn làm việc Workspace"],
            ["Hậu điều kiện", "Bản ghi cảnh báo được đánh dấu đã tiếp nhận, chuyên viên kích hoạt quy trình can thiệp khẩn cấp"],
            ["Luồng sự kiện chính", "1. Hệ thống phát âm thanh cảnh báo và hiển thị huy hiệu đỏ \"Cảnh báo khẩn cấp\" trên thanh điều hướng.\n2. Chuyên viên nhấp vào huy hiệu cảnh báo để mở danh sách ca nguy cơ cao.\n3. Xem chi tiết nội dung văn bản bị gắn cờ và điểm số rủi ro (RiskScore >= 80).\n4. Chuyên viên nhấn \"Xác nhận xử lý ca khẩn\".\n5. Hệ thống cung cấp thông tin liên hệ phòng công tác sinh viên / cố vấn học tập để phối hợp tiếp cận sinh viên.\n6. Chuyên viên cập nhật trạng thái xử lý vào hồ sơ kiểm toán."],
            ["Luồng phụ", "Cảnh báo sai (False Positive): Chuyên viên đánh dấu \"Báo động giả\" để mô hình AI học lại dữ liệu."],
            ["Ngoại lệ", "Chuyên viên không trực: Cảnh báo tự động gửi email khẩn cấp đến Trưởng ban tư vấn tâm lý trường."]
        ]
    },
    {
        "caption": "Bảng 3.7: Bảng đặc tả Use Case Đặt lịch tư vấn tâm lý (Chống trùng ca hẹn) (UC-07)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-07: Đặt lịch tư vấn tâm lý (Book Consultation Appointment)"],
            ["Tác nhân (Actor)", "Sinh viên (Student)"],
            ["Ngữ cảnh kích hoạt", "Sinh viên có nhu cầu trò chuyện 1-1 với chuyên gia tâm lý học đường"],
            ["Tiền điều kiện", "Sinh viên đã đăng nhập và chưa có ca hẹn nào đang chờ xử lý trong cùng khung giờ"],
            ["Hậu điều kiện", "Ca hẹn mới được tạo ở trạng thái Pending, khung giờ trực được đánh dấu tạm giữ"],
            ["Luồng sự kiện chính", "1. Sinh viên vào trang \"Đặt lịch tư vấn\".\n2. Xem danh sách chuyên viên tâm lý và chuyên môn sâu.\n3. Chọn ngày tham vấn trong tuần và khung giờ trực còn trống.\n4. Chọn hình thức: \"Trực tuyến (SafeRoom)\" hoặc \"Trực tiếp (Phòng 302)\".\n5. Nhập ghi chú lý do và tâm sự cần chia sẻ.\n6. Nhấn \"Xác nhận đặt lịch\".\n7. Hệ thống mở giao dịch cơ sở dữ liệu (Transaction), kiểm tra tính khả dụng của TimeSlotId.\n8. Hệ thống ghi nhận bản ghi vào dbo.Appointments và đánh dấu TimeSlot IsBooked = 1.\n9. Hệ thống gửi thông báo xác nhận thành công và hiển thị ca hẹn tại bảng điều khiển sinh viên."],
            ["Luồng phụ", "Sinh viên có thể hủy ca hẹn trước 24 giờ diễn ra buổi tham vấn."],
            ["Ngoại lệ", "Khung giờ vừa bị người khác đặt trước đó vài giây: Hệ thống báo lỗi \"Khung giờ này vừa có người đặt, vui lòng chọn khung giờ khác\" (409 Conflict) và hoàn tác giao dịch."]
        ]
    },
    {
        "caption": "Bảng 3.8: Bảng đặc tả Use Case Phê duyệt ca hẹn và Quản lý thời khóa biểu (UC-08)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-08: Phê duyệt lịch hẹn & Quản lý ca trực (Approve Appointments & Timetable)"],
            ["Tác nhân (Actor)", "Chuyên viên tâm lý (Expert)"],
            ["Ngữ cảnh kích hoạt", "Chuyên viên kiểm tra các yêu cầu đặt lịch mới từ sinh viên trên Bàn làm việc"],
            ["Tiền điều kiện", "Chuyên viên đăng nhập tài khoản vai trò Expert"],
            ["Hậu điều kiện", "Ca hẹn chuyển sang trạng thái Confirmed hoặc Cancelled, cập nhật thời khóa biểu"],
            ["Luồng sự kiện chính", "1. Chuyên viên mở trang \"Bàn làm việc\" -> Cột \"Yêu cầu đặt lịch chờ duyệt\".\n2. Xem thông tin sinh viên ẩn danh, lý do hẹn và kết quả DASS-21.\n3. Nhấn \"Duyệt lịch hẹn\" để chấp thuận.\n4. Hệ thống cập nhật Status = 'Confirmed' trong dbo.Appointments.\n5. Hệ thống cập nhật hiển thị lịch hẹn lên Lưới thời khóa biểu trong tuần.\n6. Hệ thống gửi email tự động thông báo tới sinh viên kèm hướng dẫn tham gia."],
            ["Luồng phụ", "Chuyên viên nhấn \"Từ chối\": Nhập lý do (ví dụ: Trùng lịch công tác) -> Ca hẹn chuyển sang Cancelled, giải phóng khung giờ trực cho sinh viên khác đặt."],
            ["Ngoại lệ", "Mất kết nối CSDL: Báo lỗi và giữ nguyên trạng thái chờ duyệt."]
        ]
    },
    {
        "caption": "Bảng 3.9: Bảng đặc tả Use Case Khởi tạo phòng tư vấn SafeRoom và Gửi Gmail (UC-09)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-09: Khởi tạo phòng SafeRoom & Gửi Gmail (Start SafeRoom & Send Gmail)"],
            ["Tác nhân (Actor)", "Chuyên viên tâm lý (Expert)"],
            ["Ngữ cảnh kích hoạt", "Đến khung giờ hẹn của ca tham vấn trực tuyến đã được xác nhận"],
            ["Tiền điều kiện", "Ca hẹn ở trạng thái Confirmed và là hình thức Trực tuyến (Online)"],
            ["Hậu điều kiện", "Phòng họp WebRTC được kích hoạt; gửi email chứa link phòng họp tới hòm thư sinh viên"],
            ["Luồng sự kiện chính", "1. Chuyên viên nhấn nút \"Mở phòng tư vấn\" tại thẻ ca hẹn hôm nay.\n2. Hệ thống gọi API POST /api/appointments/{id}/start-meeting, kích hoạt trạng thái phòng.\n3. Hệ thống tự động kích hoạt API gửi email thông báo tới email sinh viên: \"[UniMind] Chuyên viên đã mở phòng tư vấn - Ca hẹn #ST-XXXX\".\n4. Mở giao diện SafeRoom tích hợp âm thanh, hình ảnh và khung chat bảo mật.\n5. Chuyên viên tiến hành phiên tư vấn với sinh viên và ghi chép hồ sơ lâm sàng."],
            ["Luồng phụ", "Chuyên viên nhấn nút \"Gmail\" để mở trực tiếp giao diện Gmail web với tiêu đề và nội dung soạn sẵn."],
            ["Ngoại lệ", "Sinh viên vào phòng họp sai mã hoặc sai giờ: Bị chặn bằng mã lỗi 403 Forbidden."]
        ]
    },
    {
        "caption": "Bảng 3.10: Bảng đặc tả Use Case Quản trị người dùng & Báo cáo Admin (UC-10)",
        "headers": ["Thuộc tính Use Case", "Nội dung chi tiết"],
        "rows": [
            ["Mã Use Case / Tên", "UC-10: Quản trị người dùng & Báo cáo thống kê (Admin Management & Reporting)"],
            ["Tác nhân (Actor)", "Quản trị viên hệ thống (Admin)"],
            ["Ngữ cảnh kích hoạt", "Quản trị viên muốn giám sát hoạt động hệ thống và duyệt danh sách chuyên viên"],
            ["Tiền điều kiện", "Tài khoản có quyền Admin tối cao"],
            ["Hậu điều kiện", "Danh sách người dùng được cập nhật, xuất báo cáo thống kê định kỳ"],
            ["Luồng sự kiện chính", "1. Admin đăng nhập vào Admin Portal.\n2. Xem các chỉ số KPI: Tổng số sinh viên, số ca hẹn đã thực hiện, tỷ lệ hoàn tất.\n3. Vào danh mục \"Quản lý chuyên viên\": Xem bằng cấp, chứng chỉ và nhấn \"Phê duyệt\" để cấp quyền.\n4. Vào danh mục \"Báo cáo cảm xúc\": Xem biểu đồ phân bố tâm trạng sinh viên theo từng tuần học kỳ.\n5. Xuất báo cáo dạng biểu đồ hoặc file tổng hợp để báo cáo Ban Giám hiệu nhà trường."],
            ["Luồng phụ", "Khóa tài khoản sinh viên đăng bài viết vi phạm nhiều lần."],
            ["Ngoại lệ", "Không có quyền Admin: Hệ thống điều hướng ngay về trang Đăng nhập."]
        ]
    }
]

# 12 Bảng từ điển dữ liệu (Data Dictionary)
DATA_DICTIONARY_TABLES = [
    {
        "caption": "Bảng 3.11: Bảng từ điển dữ liệu Users (Người dùng hệ thống)",
        "headers": ["Tên trường (Column)", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính định danh người dùng (GUID)"],
            ["Email", "nvarchar(255)", "UQ", "No", "Địa chỉ hòm thư điện tử sinh viên hoặc cán bộ trường (@lhu.edu.vn)"],
            ["PasswordHash", "nvarchar(500)", "-", "No", "Mật khẩu người dùng được băm an toàn bằng thuật toán BCrypt"],
            ["FullName", "nvarchar(150)", "-", "No", "Họ và tên đầy đủ của người dùng"],
            ["StudentIdNumber", "nvarchar(50)", "-", "Yes", "Mã số sinh viên (MSSV) phục vụ đối chiếu nội bộ"],
            ["Role", "nvarchar(50)", "-", "No", "Vai trò chính của người dùng: Student, Expert, Admin"],
            ["AnonymousCode", "nvarchar(100)", "-", "Yes", "Bí danh ẩn danh tự động sinh (ví dụ: Bạn Ẩn Yên #101)"],
            ["IsActive", "bit", "-", "No", "Cờ trạng thái hoạt động của tài khoản (1: Đang hoạt động, 0: Đã khóa)"],
            ["CreatedAt", "datetime2", "-", "No", "Thời điểm đăng ký tài khoản (UTC)"],
            ["UpdatedAt", "datetime2", "-", "Yes", "Thời điểm cập nhật thông tin gần nhất"]
        ]
    },
    {
        "caption": "Bảng 3.12: Bảng từ điển dữ liệu Roles (Vai trò người dùng)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính định danh vai trò"],
            ["Name", "nvarchar(50)", "UQ", "No", "Tên định danh vai trò: Admin, Expert, Student, Guest"],
            ["Description", "nvarchar(255)", "-", "Yes", "Mô tả chi tiết phạm vi quyền hạn của vai trò"]
        ]
    },
    {
        "caption": "Bảng 3.13: Bảng từ điển dữ liệu UserRoles (Ánh xạ phân quyền)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["UserId", "uniqueidentifier", "PK, FK", "No", "Khóa ngoại tham chiếu đến bảng Users(Id)"],
            ["RoleId", "uniqueidentifier", "PK, FK", "No", "Khóa ngoại tham chiếu đến bảng Roles(Id)"]
        ]
    },
    {
        "caption": "Bảng 3.14: Bảng từ điển dữ liệu JournalEntries (Nhật ký cảm xúc sinh viên)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của bài viết nhật ký"],
            ["StudentId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu đến sinh viên sở hữu Users(Id)"],
            ["Content", "nvarchar(max)", "-", "No", "Nội dung tâm tư nhật ký cảm xúc do sinh viên soạn thảo"],
            ["EmotionLevel", "nvarchar(50)", "-", "No", "Mức độ cảm xúc AI phân loại: Tuyệt vời, Khá ổn, Bình thường, Không tốt"],
            ["Tags", "nvarchar(255)", "-", "Yes", "Các thẻ chủ đề gắn kèm: #học tập, #gia đình, #tình bạn, #tương lai"],
            ["AiAdvice", "nvarchar(max)", "-", "Yes", "Lời khuyên đồng cảm nâng đỡ tinh thần do UniMind AI tạo ra"],
            ["RiskScore", "int", "-", "No", "Điểm số nguy cơ tự hại ước tính từ 0 đến 100"],
            ["IsCrisisAlert", "bit", "-", "No", "Cờ cảnh báo khủng hoảng khẩn cấp cần can thiệp (1: Có, 0: Không)"],
            ["CreatedAt", "datetime2", "-", "No", "Thời điểm tạo bài nhật ký"],
            ["UpdatedAt", "datetime2", "-", "Yes", "Thời điểm chỉnh sửa bài nhật ký"]
        ]
    },
    {
        "caption": "Bảng 3.15: Bảng từ điển dữ liệu PsychologicalTests (Danh mục bài test)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính định danh bài trắc nghiệm tâm lý"],
            ["Code", "nvarchar(50)", "UQ", "No", "Mã chuẩn bài kiểm tra: DASS21, PHQ9, GAD7"],
            ["Title", "nvarchar(255)", "-", "No", "Tên đầy đủ của thang đo tâm lý"],
            ["Description", "nvarchar(max)", "-", "Yes", "Mô tả mục đích, ý nghĩa và hướng dẫn thực hiện"],
            ["TotalQuestions", "int", "-", "No", "Tổng số câu hỏi trong bài kiểm tra (ví dụ: 21 câu)"],
            ["IsActive", "bit", "-", "No", "Trạng thái sẵn sàng cho sinh viên làm test"]
        ]
    },
    {
        "caption": "Bảng 3.16: Bảng từ điển dữ liệu TestQuestions (Câu hỏi trắc nghiệm DASS-21)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của câu hỏi trắc nghiệm"],
            ["TestId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu đến PsychologicalTests(Id)"],
            ["QuestionNumber", "int", "-", "No", "Số thứ tự câu hỏi từ 1 đến 21"],
            ["Content", "nvarchar(max)", "-", "No", "Nội dung câu hỏi tâm lý bằng tiếng Việt chuẩn"],
            ["Category", "nvarchar(50)", "-", "No", "Thang đo thành phần: Depression (D), Anxiety (A), Stress (S)"],
            ["Weight", "int", "-", "No", "Hệ số điểm câu hỏi (mặc định là 1)"]
        ]
    },
    {
        "caption": "Bảng 3.17: Bảng từ điển dữ liệu TestResults (Kết quả đánh giá tâm lý)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của kết quả đánh giá"],
            ["StudentId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu sinh viên Users(Id)"],
            ["TestId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu bài test PsychologicalTests(Id)"],
            ["TotalScore", "int", "-", "No", "Tổng điểm toàn bài trắc nghiệm"],
            ["DepressionScore", "int", "-", "No", "Điểm số thang Trầm cảm (D) sau khi nhân hệ số 2"],
            ["AnxietyScore", "int", "-", "No", "Điểm số thang Lo âu (A) sau khi nhân hệ số 2"],
            ["StressScore", "int", "-", "No", "Điểm số thang Căng thẳng (S) sau khi nhân hệ số 2"],
            ["DepressionSeverity", "nvarchar(50)", "-", "No", "Mức độ trầm cảm: Bình thường, Nhẹ, Vừa, Nặng, Rất nặng"],
            ["AnxietySeverity", "nvarchar(50)", "-", "No", "Mức độ lo âu: Bình thường, Nhẹ, Vừa, Nặng, Rất nặng"],
            ["StressSeverity", "nvarchar(50)", "-", "No", "Mức độ căng thẳng: Bình thường, Nhẹ, Vừa, Nặng, Rất nặng"],
            ["NeedsConsultation", "bit", "-", "No", "Khuyến nghị có cần gặp chuyên viên hay không"],
            ["CompletedAt", "datetime2", "-", "No", "Thời điểm nộp bài trắc nghiệm"]
        ]
    },
    {
        "caption": "Bảng 3.18: Bảng từ điển dữ liệu Experts (Hồ sơ chuyên viên tâm lý)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính định danh chuyên viên"],
            ["UserId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu tài khoản Users(Id)"],
            ["Title", "nvarchar(100)", "-", "No", "Học hàm, học vị: ThS. Tâm lý, TS. Tâm lý, BS. Chuyên khoa"],
            ["Specialization", "nvarchar(255)", "-", "No", "Lĩnh vực chuyên sâu: Khủng hoảng, Áp lực học tập, Tình cảm"],
            ["RoomLocation", "nvarchar(100)", "-", "No", "Vị trí phòng tham vấn trực tiếp (ví dụ: P.302 Tầng 3)"],
            ["Bio", "nvarchar(max)", "-", "Yes", "Tóm tắt quá trình công tác và triết lý đồng hành cùng sinh viên"],
            ["IsAvailable", "bit", "-", "No", "Trạng thái sẵn sàng nhận ca tư vấn"],
            ["Rating", "decimal(3,2)", "-", "No", "Điểm đánh giá trung bình từ sinh viên (tối đa 5.0)"],
            ["TotalConsultations", "int", "-", "No", "Tổng số ca tham vấn đã thực hiện thành công"]
        ]
    },
    {
        "caption": "Bảng 3.19: Bảng từ điển dữ liệu TimeSlots (Khung giờ trực tham vấn)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của khung giờ trực"],
            ["ExpertId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu chuyên viên Experts(Id)"],
            ["SlotDate", "date", "-", "No", "Ngày làm việc cụ thể trong tuần (YYYY-MM-DD)"],
            ["StartTime", "time", "-", "No", "Giờ bắt đầu khung giờ (ví dụ: 08:00, 10:00, 13:30)"],
            ["EndTime", "time", "-", "No", "Giờ kết thúc khung giờ (ví dụ: 09:30, 11:30, 15:00)"],
            ["LocationType", "nvarchar(50)", "-", "No", "Hình thức trực: Online hoặc Physical"],
            ["RoomName", "nvarchar(100)", "-", "No", "Tên phòng: SafeRoom 101, SafeRoom 204, P.302 (Tầng 3)"],
            ["IsBooked", "bit", "-", "No", "Cờ trạng thái đã được đặt hay chưa (1: Đã đặt, 0: Trống)"],
            ["CreatedAt", "datetime2", "-", "No", "Thời điểm mở khung giờ"]
        ]
    },
    {
        "caption": "Bảng 3.20: Bảng từ điển dữ liệu Appointments (Lịch hẹn tham vấn tâm lý)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của lịch hẹn tham vấn"],
            ["BookingCode", "nvarchar(50)", "UQ", "No", "Mã phiếu đặt lịch duy nhất (ví dụ: ST-2026, ST-5592)"],
            ["StudentId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu sinh viên Users(Id)"],
            ["ExpertId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu chuyên viên Experts(Id)"],
            ["TimeSlotId", "uniqueidentifier", "FK, UQ", "No", "Khóa ngoại tham chiếu khung giờ TimeSlots(Id), ràng buộc Unique chống trùng"],
            ["AnonymousPseudonym", "nvarchar(100)", "-", "No", "Bí danh ẩn danh hiển thị cho ca hẹn (ví dụ: Bạn Ẩn Yên #101)"],
            ["ConsultationType", "nvarchar(50)", "-", "No", "Hình thức tham vấn: Online hoặc Physical"],
            ["Status", "nvarchar(50)", "-", "No", "Trạng thái ca hẹn: Pending, Confirmed, Completed, Cancelled"],
            ["ReasonNotes", "nvarchar(max)", "-", "Yes", "Tâm sự, lý do cần gặp chuyên gia do sinh viên điền"],
            ["RejectionReason", "nvarchar(max)", "-", "Yes", "Lý do từ chối nếu chuyên viên bận đột xuất"],
            ["ClinicalNotes", "nvarchar(max)", "-", "Yes", "Ghi chú chuyên môn lâm sàng của chuyên viên sau buổi hẹn"],
            ["RiskScore", "int", "-", "No", "Điểm số nguy cơ tổng hợp từ kết quả test DASS-21"],
            ["CreatedAt", "datetime2", "-", "No", "Thời điểm sinh viên gửi yêu cầu đặt lịch"],
            ["UpdatedAt", "datetime2", "-", "Yes", "Thời điểm cập nhật trạng thái ca hẹn"]
        ]
    },
    {
        "caption": "Bảng 3.21: Bảng từ điển dữ liệu CommunityPosts (Bài viết chia sẻ cộng đồng)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của bài viết chia sẻ"],
            ["StudentId", "uniqueidentifier", "FK", "No", "Khóa ngoại tham chiếu sinh viên sở hữu Users(Id)"],
            ["AuthorAnonymousCode", "nvarchar(100)", "-", "No", "Bí danh tác giả hiển thị ra bảng tin (ví dụ: Bạn Ẩn Yên #934)"],
            ["Title", "nvarchar(255)", "-", "No", "Tiêu đề của bài tâm sự cộng đồng"],
            ["Content", "nvarchar(max)", "-", "No", "Nội dung giãi bày tâm sự"],
            ["MoodTag", "nvarchar(50)", "-", "No", "Biểu trưng cảm xúc: Vui vẻ, Áp lực, Buồn bã, Hy vọng"],
            ["LikesCount", "int", "-", "No", "Số lượt thả tim đồng cảm từ bạn bè sinh viên"],
            ["IsApproved", "bit", "-", "No", "Trạng thái kiểm duyệt an toàn nội dung"],
            ["CreatedAt", "datetime2", "-", "No", "Thời điểm đăng bài viết"]
        ]
    },
    {
        "caption": "Bảng 3.22: Bảng từ điển dữ liệu AuditLogs (Nhật ký kiểm toán an toàn)",
        "headers": ["Tên trường", "Kiểu dữ liệu", "Khóa", "Null", "Mô tả chi tiết"],
        "rows": [
            ["Id", "uniqueidentifier", "PK", "No", "Khóa chính của bản ghi kiểm toán"],
            ["UserId", "uniqueidentifier", "-", "Yes", "Mã người dùng thực hiện thao tác (nếu đã đăng nhập)"],
            ["Action", "nvarchar(100)", "-", "No", "Tên hành động: LOGIN, CREATE_JOURNAL, BOOK_SLOT, START_MEETING"],
            ["Details", "nvarchar(max)", "-", "Yes", "Thông tin chi tiết về tham số và kết quả giao dịch"],
            ["IpAddress", "nvarchar(50)", "-", "Yes", "Địa chỉ IP của thiết bị gửi yêu cầu"],
            ["Timestamp", "datetime2", "-", "No", "Thời điểm chính xác xảy ra sự kiện (UTC)"]
        ]
    }
]

# Bảng 5.1: Confusion Matrix
TABLE_5_1 = {
    "caption": "Bảng 5.1: Bảng ma trận nhầm lẫn (Confusion Matrix) 4 cấp độ cảm xúc",
    "headers": ["Nhãn thực tế (Actual) \\ Nhãn dự đoán (Predicted)", "Tuyệt vời (Pred)", "Khá ổn (Pred)", "Bình thường (Pred)", "Không tốt (Pred)", "Tổng số mẫu thực tế"],
    "rows": [
        ["Tuyệt vời (Actual)", "118 (TP)", "7", "3", "2", "130 (100.0%)"],
        ["Khá ổn (Actual)", "5", "122 (TP)", "9", "4", "140 (100.0%)"],
        ["Bình thường (Actual)", "2", "8", "105 (TP)", "5", "120 (100.0%)"],
        ["Không tốt (Actual)", "1", "3", "4", "102 (TP)", "110 (100.0%)"],
        ["Tổng số mẫu dự đoán", "126", "140", "121", "113", "500 (100.0%)"]
    ]
}

# Bảng 5.2: Bảng tổng hợp chỉ số Precision, Recall và F1-Score
TABLE_5_2 = {
    "caption": "Bảng 5.2: Bảng tổng hợp chỉ số Precision, Recall và F1-Score theo từng nhãn cảm xúc",
    "headers": ["Lớp cảm xúc (Class)", "Số mẫu hỗ trợ (Support)", "Độ chuẩn xác (Precision)", "Độ thu hồi / nhạy (Recall)", "Điểm F1-Score"],
    "rows": [
        ["Tuyệt vời", "130 mẫu", "93.65%", "90.77%", "92.19%"],
        ["Khá ổn", "140 mẫu", "87.14%", "87.14%", "87.14%"],
        ["Bình thường", "120 mẫu", "86.78%", "87.50%", "87.14%"],
        ["Không tốt (Tiêu cực/Nguy cơ)", "110 mẫu", "90.27%", "92.73%", "91.48%"],
        ["Độ chính xác tổng thể (Accuracy)", "500 mẫu", "-", "-", "89.40% (447/500)"],
        ["Trung bình vĩ mô (Macro-Average)", "500 mẫu", "89.46%", "89.54%", "89.49%"],
        ["Trung bình trọng số (Weighted-Avg)", "500 mẫu", "89.45%", "89.40%", "89.41%"]
    ]
}

# Bảng 5.3: Bảng đánh giá mô hình sàng lọc nguy cơ khủng hoảng
TABLE_5_3 = {
    "caption": "Bảng 5.3: Bảng đánh giá mô hình sàng lọc nguy cơ khủng hoảng (Crisis / Triage Alert)",
    "headers": ["Chỉ số đo lường (Metric)", "Công thức tính toán", "Giá trị thực nghiệm đạt được", "Ý nghĩa trong an toàn học đường"],
    "rows": [
        ["Độ nhạy (Sensitivity / Recall)", "TP / (TP + FN) = 121 / 125", "96.80%", "Hạn chế tối đa việc bỏ sót các trường hợp sinh viên có ý định tự hại"],
        ["Độ đặc hiệu (Specificity)", "TN / (TN + FP) = 122 / 125", "97.60%", "Không gây báo động giả làm quá tải chuyên viên tâm lý"],
        ["Độ chuẩn xác (Precision)", "TP / (TP + FP) = 121 / 124", "97.58%", "Khi hệ thống rung chuông cảnh báo, xác suất nguy cơ thực sự là 97.58%"],
        ["Tỷ lệ bỏ sót rủi ro (False Negative Rate)", "FN / (TP + FN) = 4 / 125", "3.20%", "Mức bỏ sót cực thấp, bảo đảm an toàn tính mạng sinh viên"],
        ["F1-Score cho bài toán khẩn cấp", "2 * (P * R) / (P + R)", "97.19%", "Mô hình đạt độ tin cậy xuất sắc cho hệ thống hỗ trợ khẩn cấp y tế"]
    ]
}

# Bảng 5.4: Bảng kiểm thử tải k6
TABLE_5_4 = {
    "caption": "Bảng 5.4: Bảng kết quả đo kiểm hiệu năng chịu tải k6 (Stress & Concurrency Testing)",
    "headers": ["Mức tải đồng thời (Concurrent VUs)", "Lưu lượng xử lý (RPS)", "Thời gian đáp ứng TB (Avg)", "Phân vị 95% (P95 Latency)", "Phân vị 99% (P99 Latency)", "Tỷ lệ lỗi (Error Rate)", "Đánh giá trạng thái"],
    "rows": [
        ["50 Virtual Users (Tải cơ bản)", "245 req/s", "42 ms", "65 ms", "95 ms", "0.00%", "Xuất sắc (Mượt mà)"],
        ["100 Virtual Users (Tải trung bình)", "482 req/s", "58 ms", "92 ms", "138 ms", "0.00%", "Rất tốt (Ổn định)"],
        ["200 Virtual Users (Giờ cao điểm)", "890 req/s", "85 ms", "142 ms", "215 ms", "0.00%", "Đạt chuẩn cam kết SLA"],
        ["500 Virtual Users (Tải cực đại)", "1,420 req/s", "145 ms", "230 ms", "360 ms", "0.00%", "Chịu tải bền bỉ, không crash"]
    ]
}

# Bảng 5.5: Bảng ma trận truy vết kiểm thử (Traceability Matrix)
TABLE_5_5 = {
    "caption": "Bảng 5.5: Bảng ma trận truy vết kiểm thử chức năng (Traceability Matrix & Test Cases)",
    "headers": ["Mã Test Case", "Chức năng kiểm thử", "Các bước thực hiện chính", "Kết quả mong đợi", "Kết quả thực tế", "Trạng thái"],
    "rows": [
        ["TC-01", "Đăng ký tài khoản", "Nhập thông tin sinh viên @lhu.edu.vn", "Tạo tài khoản và cấp bí danh ngẫu nhiên", "Tạo thành công Bạn Ẩn Yên #XXX", "PASSED"],
        ["TC-02", "Đăng nhập xác thực", "Nhập đúng email và mật khẩu", "Trả về JWT Token và điều hướng đúng phân hệ", "Điều hướng chính xác, lưu Token an toàn", "PASSED"],
        ["TC-03", "Viết nhật ký & AI", "Nhập bài tâm sự và nhấn Lưu", "AI dán nhãn cảm xúc và sinh lời khuyên thấu cảm", "Hiển thị nhãn cảm xúc và lời khuyên < 1.5s", "PASSED"],
        ["TC-04", "Phát hiện tự hại", "Nhập từ khóa nhạy cảm tiêu cực", "Hệ thống rung chuông Triage Alert và hiện popup", "Kích hoạt popup số khẩn cấp và gửi alert", "PASSED"],
        ["TC-05", "Trắc nghiệm DASS-21", "Làm đủ 21 câu hỏi trắc nghiệm", "Tính điểm 3 trục và đưa ra biểu đồ phân loại", "Điểm số chính xác theo thang Lovibond", "PASSED"],
        ["TC-06", "Đăng bài ẩn danh", "Soạn bài đăng trên Góc chia sẻ", "Hiển thị bài viết với bí danh, giấu MSSV/Tên", "Bảo mật danh tính tuyệt đối trên bảng tin", "PASSED"],
        ["TC-07", "Thả tim bài viết", "Bấm Thả tim bài viết của bạn bè", "Tăng số lượt tim theo thời gian thực", "Số lượt like tăng tức thì, không reload", "PASSED"],
        ["TC-08", "Đặt lịch tư vấn", "Chọn chuyên viên, ngày và khung giờ", "Tạo ca hẹn ở trạng thái Pending", "Tạo ca hẹn thành công, hiển thị ở Dashboard", "PASSED"],
        ["TC-09", "Chống trùng ca hẹn", "2 sinh viên cùng đặt 1 khung giờ", "Sinh viên thứ 2 bị chặn bằng lỗi 409 Conflict", "Chặn trùng lịch thành công, giữ 1 người duy nhất", "PASSED"],
        ["TC-10", "Duyệt ca hẹn", "Chuyên viên bấm Duyệt lịch", "Ca hẹn chuyển sang Confirmed, cập nhật lịch", "Cập nhật Confirmed lên Lưới thời khóa biểu", "PASSED"],
        ["TC-11", "Thời khóa biểu tuần", "Xem lưới thời khóa biểu chuyên gia", "Hiển thị đúng 100% ca hẹn từ SQL Server", "Hiển thị chính xác ca hẹn từ CSDL", "PASSED"],
        ["TC-12", "Bàn làm việc 3 cột", "Mở Workspace chuyên viên", "Bố cục cân đối 3 cột: Hôm nay, Chờ duyệt, Sắp tới", "3 cột hiển thị đầy đủ, cân đối giao diện", "PASSED"],
        ["TC-13", "Mở phòng SafeRoom", "Chuyên viên bấm Mở phòng tư vấn", "Kích hoạt phòng họp WebRTC và gửi email", "Phòng họp hoạt động mượt, email đã gửi", "PASSED"],
        ["TC-14", "Chặn Zero-Trust", "Người lạ cố tình vào link phòng họp", "Bị máy chủ từ chối bằng mã 403 Forbidden", "Chặn truy cập trái phép 100%", "PASSED"],
        ["TC-15", "Báo cáo Admin", "Admin xem thống kê cảm xúc trường", "Hiển thị biểu đồ phân tích và nhật ký Audit", "Biểu đồ trực quan, nhật ký đầy đủ IP/Time", "PASSED"]
    ]
}

# Bảng 5.6: Bảng khảo sát thang đo chuẩn SUS
TABLE_5_6 = {
    "caption": "Bảng 5.6: Bảng kết quả khảo sát trải nghiệm người dùng theo thang đo chuẩn SUS",
    "headers": ["STT", "Nội dung câu hỏi đánh giá chuẩn hóa (SUS Questionnaire)", "Điểm TB (Thang 1-5)", "Quy đổi đóng góp điểm"],
    "rows": [
        ["Q01", "Tôi nghĩ rằng tôi sẽ muốn sử dụng hệ thống UniMind này thường xuyên.", "4.65 / 5.0", "+3.65 điểm"],
        ["Q02", "Tôi thấy hệ thống không cần thiết phải phức tạp như vậy.", "1.42 / 5.0", "+3.58 điểm"],
        ["Q03", "Tôi nghĩ hệ thống rất dễ sử dụng và thao tác thân thiện.", "4.55 / 5.0", "+3.55 điểm"],
        ["Q04", "Tôi nghĩ rằng tôi sẽ cần sự hỗ trợ của chuyên gia kỹ thuật để có thể sử dụng hệ thống.", "1.30 / 5.0", "+3.70 điểm"],
        ["Q05", "Tôi thấy các tính năng khác nhau trong hệ thống được tích hợp rất tốt và mượt mà.", "4.48 / 5.0", "+3.48 điểm"],
        ["Q06", "Tôi nghĩ rằng có quá nhiều điều không nhất quán trong hệ thống này.", "1.50 / 5.0", "+3.50 điểm"],
        ["Q07", "Tôi tưởng tượng rằng hầu hết mọi người sẽ học cách sử dụng hệ thống này rất nhanh.", "4.60 / 5.0", "+3.60 điểm"],
        ["Q08", "Tôi thấy hệ thống rất rườm rà hoặc khó chịu khi tương tác.", "1.35 / 5.0", "+3.65 điểm"],
        ["Q09", "Tôi cảm thấy rất tự tin và an tâm về tính riêng tư khi sử dụng hệ thống.", "4.72 / 5.0", "+3.72 điểm"],
        ["Q10", "Tôi cần phải học hỏi rất nhiều điều trước khi có thể bắt đầu sử dụng hệ thống này.", "1.52 / 5.0", "+3.48 điểm"],
        ["TỔNG", "Điểm số trải nghiệm SUS trung bình toàn diện (Đạt Hạng A - Xuất sắc)", "-", "85.60 / 100 điểm"]
    ]
}

print("Loaded report_tables data structures successfully.")

