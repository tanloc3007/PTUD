# -*- coding: utf-8 -*-
"""
Detailed Data & Text Content for UniMind Graduation Report
Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng
"""

REPORT_TITLE = "XÂY DỰNG HỆ THỐNG NHẬT KÝ CẢM XÚC VÀ TƯ VẤN TÂM LÝ ẨN DANH DÀNH CHO SINH VIÊN (UNIMIND)"
FACULTY = "KHOA CÔNG NGHỆ THÔNG TIN"
UNIVERSITY = "TRƯỜNG ĐẠI HỌC LẠC HỒNG"
REPORT_TYPE = "BÁO CÁO HỌC PHẦN PHÁT TRIỂN ỨNG DỤNG\n(ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC NGÀNH CÔNG NGHỆ THÔNG TIN)"
INSTRUCTOR = "ThS. Lê Minh Nhật"
CLASS_NAME = "20CT111"
LOCATION_DATE = "Đồng Nai, Tháng 11/2026"

STUDENTS = [
    {"name": "Ngô Tấn Lộc", "mssv": "120000212", "role": "Trưởng nhóm", "work": "Phụ trách: Auth, Nhật ký cảm xúc, AI Sentiment, Quản lý bài test tâm lý"},
    {"name": "Lê Minh Luân", "mssv": "120000352", "role": "Thành viên", "work": "Phụ trách: Đặt lịch tư vấn, Chống trùng ca hẹn, Góc chia sẻ ẩn danh, Báo cáo Admin"}
]

ABBREVIATIONS = [
    ("AI", "Artificial Intelligence", "Trí tuệ nhân tạo"),
    ("LLM", "Large Language Model", "Mô hình ngôn ngữ lớn (Gemini, GPT)"),
    ("API", "Application Programming Interface", "Giao diện lập trình ứng dụng"),
    ("REST", "Representational State Transfer", "Kiến trúc thiết kế dịch vụ web chuẩn"),
    ("JWT", "JSON Web Token", "Chuẩn mã hóa thông tin xác thực an toàn"),
    ("RBAC", "Role-Based Access Control", "Mô hình kiểm soát truy cập dựa trên vai trò"),
    ("DASS-21", "Depression Anxiety Stress Scale 21", "Thang đo 21 câu đánh giá Trầm cảm, Lo âu, Căng thẳng"),
    ("WebRTC", "Web Real-Time Communication", "Giao thức truyền thông âm thanh/hình ảnh thời gian thực"),
    ("E2EE", "End-to-End Encryption", "Mã hóa đầu cuối bảo vệ dữ liệu nhạy cảm"),
    ("PII", "Personally Identifiable Information", "Thông tin nhận dạng cá nhân cần che giấu"),
    ("EF Core", "Entity Framework Core", "Thư viện ORM ánh xạ đối tượng - CSDL của Microsoft"),
    ("RDBMS", "Relational Database Management System", "Hệ quản trị cơ sở dữ liệu quan hệ (SQL Server)"),
    ("ACID", "Atomicity, Consistency, Isolation, Durability", "4 đặc tính toàn vẹn giao dịch trong cơ sở dữ liệu"),
    ("CRUD", "Create, Read, Update, Delete", "4 thao tác cơ bản trên dữ liệu"),
    ("DoD", "Definition of Done", "Định nghĩa hoàn thành của tính năng phần mềm"),
    ("AC", "Acceptance Criteria", "Tiêu chí nghiệm thu của Use Case / User Story"),
    ("SUS", "System Usability Scale", "Thang đo tiêu chuẩn đánh giá khả năng sử dụng hệ thống"),
    ("ROC", "Receiver Operating Characteristic", "Đường cong đặc trưng hoạt động của bộ phân loại"),
    ("AUC", "Area Under the Curve", "Diện tích dưới đường cong ROC"),
    ("P95 / P99", "95th / 99th Percentile Latency", "Thời gian phản hồi ở phân vị thứ 95 và 99"),
    ("VUs", "Virtual Users", "Số lượng người dùng ảo đồng thời trong kiểm thử tải"),
    ("RPS", "Requests Per Second", "Số yêu cầu xử lý thành công trên mỗi giây"),
    ("JSON", "JavaScript Object Notation", "Định dạng trao đổi dữ liệu chuẩn"),
    ("CORS", "Cross-Origin Resource Sharing", "Cơ chế chia sẻ tài nguyên giữa các nguồn khác nhau"),
    ("SPA", "Single Page Application", "Ứng dụng web trang đơn chạy phía máy khách")
]

PREFACE_TEXT = [
    "Lời đầu tiên, nhóm tác giả xin gửi lời chào trân trọng và lòng biết ơn chân thành nhất đến quý Thầy, Cô Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng. Trong suốt quá trình học tập và rèn luyện dưới mái trường Đại học Lạc Hồng, nhóm đã được tiếp thu những nền tảng tri thức vững chắc về khoa học máy tính, kỹ nghệ phần mềm và các công nghệ phát triển ứng dụng hiện đại.",
    "Đồ án tốt nghiệp / Báo cáo học phần Phát triển ứng dụng với đề tài: \"Xây dựng hệ thống nhật ký cảm xúc và hỗ trợ tư vấn tâm lý ẩn danh dành cho sinh viên (UniMind)\" là công trình đúc kết những nỗ lực học hỏi, nghiên cứu và lập trình nghiêm túc của nhóm trong suốt thời gian qua. Đề tài xuất phát từ sự thấu hiểu sâu sắc đối với những áp lực học tập, thi cử, tài chính và các biến cố tâm lý mà sinh viên đang phải đối mặt trong môi trường đại học.",
    "Mục tiêu cốt lõi của UniMind là xây dựng một nền tảng hỗ trợ sức khỏe tinh thần toàn diện, kết hợp chặt chẽ giữa Trí tuệ nhân tạo (AI Sentiment Analysis) và chuyên môn sâu của các chuyên gia tâm lý học đường. Hệ thống cam kết bảo vệ sự riêng tư tối đa thông qua cơ chế ẩn danh hóa (Pseudonymization), cung cấp công cụ tự theo dõi cảm xúc mỗi ngày, làm trắc nghiệm sàng lọc DASS-21 chuẩn hóa, kết nối cộng đồng sẻ chia tích cực và đặt lịch hẹn tư vấn 1-1 trực tuyến / trực tiếp không lo lộ danh tính.",
    "Nhóm xin bày tỏ lòng biết ơn sâu sắc đến ThS. Lê Minh Nhật - Giảng viên hướng dẫn, người thầy đã luôn tận tâm chỉ dẫn, định hướng kiến trúc, truyền đạt những kinh nghiệm quý báu và đưa ra những lời góp ý sâu sắc giúp đồ án hoàn thiện cả về mặt học thuật lẫn ứng dụng thực tiễn.",
    "Dù đã nỗ lực hết mình để xây dựng hệ thống hoàn chỉnh theo chuẩn Clean Architecture 4 tầng và các quy chuẩn kiểm thử nghiêm ngặt, đề tài khó tránh khỏi những thiếu sót nhất định. Nhóm rất mong nhận được những ý kiến đóng góp, chỉ bảo quý báu từ Hội đồng đánh giá và quý Thầy Cô để hệ thống ngày càng hoàn thiện và có thể ứng dụng rộng rãi trong thực tế học đường.",
    "Kính chúc quý Thầy Cô luôn dồi dào sức khỏe, hạnh phúc và thành công trên con đường trồng người cao quý!",
    "Sinh viên thực hiện:\nNgô Tấn Lộc (Trưởng nhóm - MSSV: 120000212)\nLê Minh Luân (Thành viên - MSSV: 120000352)"
]

TABLE_OF_CONTENTS_LIST = [
    ("LỜI NÓI ĐẦU", "ii"),
    ("DANH MỤC TỪ VIẾT TẮT", "iii"),
    ("MỤC LỤC", "iv"),
    ("MỤC LỤC BẢNG", "v"),
    ("MỤC LỤC HÌNH", "vi"),
    ("CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI", "1"),
    ("  1.1 Tổng quan bối cảnh thực tế", "1"),
    ("  1.2 Lý do chọn đề tài và tính cấp thiết", "2"),
    ("  1.3 Mục tiêu và phạm vi của đề tài", "3"),
    ("    1.3.1 Mục tiêu tổng quát", "3"),
    ("    1.3.2 Mục tiêu cụ thể", "4"),
    ("    1.3.3 Phạm vi và đối tượng thụ hưởng", "4"),
    ("  1.4 Khảo sát và so sánh với các hệ thống tương tự", "5"),
    ("CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ ÁP DỤNG", "7"),
    ("  2.1 Tổng quan về kiến trúc Clean Architecture & ASP.NET Core 8 Web API", "7"),
    ("    2.1.1 Khái niệm và nguyên lý phụ thuộc (Dependency Rule)", "7"),
    ("    2.1.2 Cấu trúc phân tầng Clean Architecture trong UniMind", "8"),
    ("    2.1.3 Lý do lựa chọn .NET 8, C# 12 và kiến trúc Thin Controller", "10"),
    ("  2.2 Tổng quan về hệ sinh thái Frontend React 18, Vite và Tailwind CSS", "11"),
    ("    2.2.1 Khái niệm Single Page Application và React 18", "11"),
    ("    2.2.2 Kiến trúc Feature-based Architecture và Quản lý trạng thái Zustand", "12"),
    ("    2.2.3 Ngôn ngữ thiết kế cảm xúc (Emotional Arc UI/UX) và Glassmorphism", "13"),
    ("  2.3 Tổng quan về Hệ quản trị Cơ sở dữ liệu SQL Server & Entity Framework Core", "14"),
    ("    2.3.1 Cơ sở dữ liệu quan hệ SQL Server và chuẩn toàn vẹn ACID", "14"),
    ("    2.3.2 Cơ chế Code-First Migration và ánh xạ DTO", "15"),
    ("    2.3.3 Phân tích so sánh chuyên sâu giữa SQL Server và MongoDB", "16"),
    ("  2.4 Tổng quan về Trí tuệ nhân tạo (AI/LLM) trong phân tích cảm xúc & sàng lọc khủng hoảng", "17"),
    ("    2.4.1 Mô hình ngôn ngữ lớn Google Gemini Flash và PhoBERT tiếng Việt", "17"),
    ("    2.4.2 Thuật toán phân tích sắc thái cảm xúc 4 cấp độ", "18"),
    ("    2.4.3 Cơ chế phân loại nguy cơ tự hại (Crisis / Triage Alert) và Zero-Trust", "19"),
    ("CHƯƠNG 3: NỘI DUNG THỰC HIỆN VÀ PHÂN TÍCH THIẾT KẾ HỆ THỐNG", "21"),
    ("  3.1 Đối tượng sử dụng (Actor Register) và Ma trận phân quyền RBAC", "21"),
    ("  3.2 Phân hệ chức năng chính của hệ thống", "22"),
    ("    3.2.1 Phân hệ Sinh viên (Student Portal)", "22"),
    ("    3.2.2 Phân hệ Chuyên viên tâm lý (Expert Portal)", "23"),
    ("    3.2.3 Phân hệ Quản trị viên (Admin Portal)", "24"),
    ("  3.3 Phân tích và Đặc tả Use Case chi tiết", "25"),
    ("    3.3.1 Sơ đồ Use Case tổng thể", "25"),
    ("    3.3.2 Bảng đặc tả Use Case Đăng nhập và Xác thực JWT", "26"),
    ("    3.3.3 Bảng đặc tả Use Case Đổi mật khẩu và Quản lý tài khoản", "27"),
    ("    3.3.4 Bảng đặc tả Use Case Ghi nhật ký cảm xúc & Lời khuyên AI", "28"),
    ("    3.3.5 Bảng đặc tả Use Case Thực hiện bài trắc nghiệm tâm lý DASS-21", "29"),
    ("    3.3.6 Bảng đặc tả Use Case Góc chia sẻ ẩn danh & Triage Alert", "30"),
    ("    3.3.7 Bảng đặc tả Use Case Đặt lịch tư vấn tâm lý (Chống trùng lịch)", "31"),
    ("    3.3.8 Bảng đặc tả Use Case Phê duyệt ca hẹn và Quản lý thời khóa biểu", "32"),
    ("    3.3.9 Bảng đặc tả Use Case Khởi tạo phòng họp SafeRoom và Gửi Gmail", "33"),
    ("    3.3.10 Bảng đặc tả Use Case Quản trị người dùng & Báo cáo Admin", "34"),
    ("  3.4 Sơ đồ hoạt động hệ thống (Activity Diagrams & Workflows)", "35"),
    ("    3.4.1 Quy trình ghi nhận nhật ký cảm xúc và AI tư vấn", "35"),
    ("    3.4.2 Quy trình chống trùng ca hẹn (Anti-Double-Booking Constraint)", "36"),
    ("    3.4.3 Quy trình kiểm soát Zero-Trust vào phòng SafeRoom trực tuyến", "37"),
    ("  3.5 Thiết kế Cơ sở dữ liệu (Database Design & ERD)", "38"),
    ("    3.5.1 Sơ đồ quan hệ thực thể (ERD tổng thể)", "38"),
    ("    3.5.2 Từ điển dữ liệu chi tiết các bảng CSDL", "39"),
    ("    3.5.3 Chiến lược thiết lập chỉ mục (Indexes) và Ràng buộc toàn vẹn", "45"),
    ("CHƯƠNG 4: HIỆN THỰC VÀ ĐÓNG GÓI SẢN PHẨM", "46"),
    ("  4.1 Môi trường phát triển và Kiến trúc triển khai", "46"),
    ("  4.2 Giao diện hiện thực Phân hệ Sinh viên", "47"),
    ("    4.2.1 Giao diện Bảng điều khiển sinh viên và Lịch sử cảm xúc AI", "47"),
    ("    4.2.2 Giao diện Viết nhật ký cảm xúc và Lời khuyên UniMind AI", "48"),
    ("    4.2.3 Giao diện Làm bài trắc nghiệm tâm lý DASS-21", "49"),
    ("    4.2.4 Giao diện Góc chia sẻ cộng đồng ẩn danh", "50"),
    ("    4.2.5 Giao diện Đặt lịch tham vấn với Chuyên viên", "51"),
    ("  4.3 Giao diện hiện thực Phân hệ Chuyên viên tâm lý", "52"),
    ("    4.3.1 Bàn làm việc Chuyên viên (Workspace) bố cục 3 cột cân đối", "52"),
    ("    4.3.2 Thời khóa biểu tham vấn trong tuần kết nối CSDL thực tế", "53"),
    ("    4.3.3 Phòng tư vấn trực tuyến SafeRoom (SafeCall WebRTC)", "54"),
    ("  4.4 Giao diện hiện thực Phân hệ Quản trị viên (Admin Portal)", "55"),
    ("CHƯƠNG 5: THỬ NGHIỆM, ĐÁNH GIÁ ĐỘ CHÍNH XÁC VÀ KẾT QUẢ", "56"),
    ("  5.1 Phương pháp đánh giá độ chính xác mô hình AI phân loại cảm xúc", "56"),
    ("    5.1.1 Thiết kế tập dữ liệu kiểm thử (Test Dataset)", "56"),
    ("    5.1.2 Ma trận nhầm lẫn (Confusion Matrix 4x4)", "57"),
    ("    5.1.3 Các độ đo toán học: Accuracy, Precision, Recall, F1-Score", "58"),
    ("    5.1.4 Đánh giá độ chính xác phát hiện nguy cơ khủng hoảng (Crisis/Triage Alert)", "60"),
    ("  5.2 Đánh giá hiệu năng và tải hệ thống (Performance & Concurrency Load Testing)", "61"),
    ("    5.2.1 Kịch bản kiểm thử tải với k6 (50 - 500 Virtual Users)", "61"),
    ("    5.2.2 Phân tích kết quả thời gian phản hồi (Latency P95, P99, RPS)", "62"),
    ("  5.3 Kiểm thử chức năng và Đánh giá trải nghiệm người dùng", "64"),
    ("    5.3.1 Ma trận truy vết kiểm thử chức năng (Traceability Matrix)", "64"),
    ("    5.3.2 Đánh giá mức độ hài lòng theo thang đo SUS (System Usability Scale)", "66"),
    ("CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN", "68"),
    ("  6.1 Kết quả đạt được của đề tài", "68"),
    ("  6.2 Ưu điểm nổi bật và Những hạn chế còn tồn tại", "69"),
    ("  6.3 Hướng phát triển và nâng cấp trong tương lai", "70"),
    ("TÀI LIỆU THAM KHẢO", "71")
]

TABLE_LIST = [
    ("Bảng 1.1", "Bảng so sánh hệ thống UniMind với các giải pháp hỗ trợ tâm lý tương tự", "6"),
    ("Bảng 2.1", "Bảng so sánh chuyên sâu giữa SQL Server và NoSQL MongoDB", "16"),
    ("Bảng 3.1", "Bảng đặc tả Use Case Đăng nhập hệ thống", "26"),
    ("Bảng 3.2", "Bảng đặc tả Use Case Đổi mật khẩu", "27"),
    ("Bảng 3.3", "Bảng đặc tả Use Case Viết nhật ký cảm xúc & Lời khuyên AI", "28"),
    ("Bảng 3.4", "Bảng đặc tả Use Case Thực hiện bài trắc nghiệm DASS-21", "29"),
    ("Bảng 3.5", "Bảng đặc tả Use Case Đăng bài viết chia sẻ ẩn danh", "30"),
    ("Bảng 3.6", "Bảng đặc tả Use Case Xử lý cảnh báo Triage Alert", "30"),
    ("Bảng 3.7", "Bảng đặc tả Use Case Đặt lịch tư vấn tâm lý", "31"),
    ("Bảng 3.8", "Bảng đặc tả Use Case Phê duyệt lịch hẹn tham vấn", "32"),
    ("Bảng 3.9", "Bảng đặc tả Use Case Khởi tạo phòng tư vấn SafeRoom", "33"),
    ("Bảng 3.10", "Bảng đặc tả Use Case Báo cáo thống kê quản trị", "34"),
    ("Bảng 3.11", "Bảng từ điển dữ liệu Users (Người dùng hệ thống)", "39"),
    ("Bảng 3.12", "Bảng từ điển dữ liệu Roles (Vai trò người dùng)", "39"),
    ("Bảng 3.13", "Bảng từ điển dữ liệu UserRoles (Ánh xạ quyền)", "40"),
    ("Bảng 3.14", "Bảng từ điển dữ liệu JournalEntries (Nhật ký cảm xúc)", "40"),
    ("Bảng 3.15", "Bảng từ điển dữ liệu PsychologicalTests (Danh mục bài test)", "41"),
    ("Bảng 3.16", "Bảng từ điển dữ liệu TestQuestions (Câu hỏi trắc nghiệm DASS-21)", "41"),
    ("Bảng 3.17", "Bảng từ điển dữ liệu TestResults (Kết quả đánh giá tâm lý)", "42"),
    ("Bảng 3.18", "Bảng từ điển dữ liệu Experts (Hồ sơ chuyên viên)", "42"),
    ("Bảng 3.19", "Bảng từ điển dữ liệu TimeSlots (Khung giờ trực)", "43"),
    ("Bảng 3.20", "Bảng từ điển dữ liệu Appointments (Lịch hẹn tham vấn)", "43"),
    ("Bảng 3.21", "Bảng từ điển dữ liệu CommunityPosts (Bài viết cộng đồng ẩn danh)", "44"),
    ("Bảng 3.22", "Bảng từ điển dữ liệu AuditLogs (Nhật ký kiểm toán an toàn)", "44"),
    ("Bảng 5.1", "Bảng ma trận nhầm lẫn (Confusion Matrix) 4 cấp độ cảm xúc", "57"),
    ("Bảng 5.2", "Bảng tổng hợp chỉ số Precision, Recall và F1-Score theo từng nhãn", "59"),
    ("Bảng 5.3", "Bảng đánh giá mô hình sàng lọc nguy cơ khủng hoảng (Crisis Alert)", "60"),
    ("Bảng 5.4", "Bảng kết quả đo kiểm hiệu năng chịu tải k6 (Stress Testing)", "63"),
    ("Bảng 5.5", "Bảng ma trận truy vết kiểm thử chức năng (Traceability Matrix)", "65"),
    ("Bảng 5.6", "Bảng kết quả khảo sát trải nghiệm người dùng theo thang đo chuẩn SUS", "67")
]

FIGURE_LIST = [
    ("Hình 2.1", "Mô hình kiến trúc phần mềm Clean Architecture 4 tầng của UniMind", "8"),
    ("Hình 3.1", "Sơ đồ luồng hoạt động ghi nhận nhật ký và AI phân tích cảm xúc", "35"),
    ("Hình 3.2", "Sơ đồ quy trình chống trùng lịch tư vấn (Anti-Double-Booking)", "36"),
    ("Hình 3.3", "Sơ đồ kiểm soát Zero-Trust vào phòng SafeRoom trực tuyến", "37"),
    ("Hình 4.1", "Giao diện Bảng điều khiển sinh viên và Lịch sử nhật ký phân loại AI", "47"),
    ("Hình 4.2", "Giao diện Viết nhật ký cảm xúc và Lời khuyên thấu cảm từ UniMind AI", "48"),
    ("Hình 4.3", "Giao diện Thực hiện bài trắc nghiệm tâm lý chuẩn hóa DASS-21", "49"),
    ("Hình 4.4", "Giao diện Góc chia sẻ ẩn danh cộng đồng sinh viên", "50"),
    ("Hình 4.5", "Giao diện Đặt lịch hẹn tham vấn tâm lý trực tuyến và trực tiếp", "51"),
    ("Hình 4.6", "Bàn làm việc Chuyên viên (Workspace) bố cục 3 cột cân đối", "52"),
    ("Hình 4.7", "Thời khóa biểu tham vấn trong tuần kết nối cơ sở dữ liệu thực tế", "53"),
    ("Hình 4.8", "Giao diện Phòng tư vấn trực tuyến SafeRoom (SafeCall WebRTC)", "54"),
    ("Hình 5.1", "Biểu đồ nhiệt Ma trận nhầm lẫn (Confusion Matrix) phân loại cảm xúc", "58"),
    ("Hình 5.2", "Biểu đồ so sánh Precision, Recall và F1-Score giữa 4 mức độ cảm xúc", "59"),
    ("Hình 5.3", "Biểu đồ thời gian đáp ứng API theo mức độ người dùng đồng thời", "63")
]

print("Loaded report_data metadata successfully.")

