# -*- coding: utf-8 -*-
"""
Main Execution Script for Building the UniMind Graduation Report (.docx)
Khoa Công nghệ Thông tin - Trường Đại học Lạc Hồng
"""

import os
import docx
from docx import Document
from docx.shared import Pt, Cm, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

from build_report import (
    TEMPLATE_PATH, OUTPUT_PATH, IMG_DIR,
    add_heading_1, add_heading_2, add_heading_3, add_heading_4,
    add_body_paragraph, add_caption, add_custom_table, add_image_figure,
    parse_and_add_content, set_cell_background, set_cell_margins, set_table_borders
)
from report_data import (
    REPORT_TITLE, FACULTY, UNIVERSITY, REPORT_TYPE, INSTRUCTOR, CLASS_NAME, LOCATION_DATE,
    STUDENTS, ABBREVIATIONS, PREFACE_TEXT, TABLE_OF_CONTENTS_LIST, TABLE_LIST, FIGURE_LIST
)
from report_chapters import (
    CH1_CONTENT, CH2_CONTENT, CH3_CONTENT, CH4_CONTENT, CH5_CONTENT, CH6_CONTENT, REFERENCES_LIST
)
from report_tables import (
    TABLE_1_1, TABLE_2_1, USE_CASE_TABLES, DATA_DICTIONARY_TABLES,
    TABLE_5_1, TABLE_5_2, TABLE_5_3, TABLE_5_4, TABLE_5_5, TABLE_5_6
)

def build_report():
    print(f"Loading template from {TEMPLATE_PATH}...")
    doc = Document(TEMPLATE_PATH)
    
    # Clear existing body elements while retaining styles, headers, and footers
    body = doc._body._element
    for child in list(body):
        if not child.tag.endswith('sectPr'):
            body.remove(child)
    print("Cleared template body. Retained styles and section properties.")
    
    # ══════════════════════════════════════════════════════════════════
    # TRANG BÌA CHÍNH (TITLE / COVER PAGE)
    # ══════════════════════════════════════════════════════════════════
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_uni.paragraph_format.space_before = Pt(0)
    p_uni.paragraph_format.space_after = Pt(2)
    r = p_uni.add_run(UNIVERSITY + "\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = RGBColor(15, 23, 42)
    
    r2 = p_uni.add_run(FACULTY + "\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(14)
    r2.font.bold = True
    r2.font.color.rgb = RGBColor(2, 132, 199)
    
    r_star = p_uni.add_run("--- *** ---\n")
    r_star.font.name = 'Times New Roman'
    r_star.font.size = Pt(12)
    r_star.font.color.rgb = RGBColor(100, 116, 139)
    
    # Logo
    logo_path = os.path.join(IMG_DIR, 'logo_unimind.png')
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(8)
        p_logo.paragraph_format.space_after = Pt(14)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.8))
        
    p_type = doc.add_paragraph()
    p_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_type.paragraph_format.space_before = Pt(10)
    p_type.paragraph_format.space_after = Pt(10)
    r_type = p_type.add_run(REPORT_TYPE)
    r_type.font.name = 'Times New Roman'
    r_type.font.size = Pt(17)
    r_type.font.bold = True
    r_type.font.color.rgb = RGBColor(15, 23, 42)
    
    p_topic = doc.add_paragraph()
    p_topic.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_topic.paragraph_format.space_before = Pt(8)
    p_topic.paragraph_format.space_after = Pt(4)
    r_topic_lbl = p_topic.add_run("ĐỀ TÀI:\n")
    r_topic_lbl.font.name = 'Times New Roman'
    r_topic_lbl.font.size = Pt(15)
    r_topic_lbl.font.bold = True
    r_topic_lbl.font.color.rgb = RGBColor(100, 116, 139)
    
    r_topic_name = p_topic.add_run(REPORT_TITLE)
    r_topic_name.font.name = 'Times New Roman'
    r_topic_name.font.size = Pt(18)
    r_topic_name.font.bold = True
    r_topic_name.font.color.rgb = RGBColor(2, 132, 199)
    
    # Metadata Block
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_meta.paragraph_format.left_indent = Inches(1.2)
    p_meta.paragraph_format.space_before = Pt(36)
    p_meta.paragraph_format.space_after = Pt(40)
    p_meta.paragraph_format.line_spacing = 1.3
    
    r_gvhd = p_meta.add_run(f"GIẢNG VIÊN HƯỚNG DẪN:  {INSTRUCTOR}\n")
    r_gvhd.font.name = 'Times New Roman'
    r_gvhd.font.size = Pt(13)
    r_gvhd.font.bold = True
    
    r_lop = p_meta.add_run(f"LỚP:                                           {CLASS_NAME}\n")
    r_lop.font.name = 'Times New Roman'
    r_lop.font.size = Pt(13)
    r_lop.font.bold = True
    
    r_svth = p_meta.add_run("SINH VIÊN THỰC HIỆN:\n")
    r_svth.font.name = 'Times New Roman'
    r_svth.font.size = Pt(13)
    r_svth.font.bold = True
    
    for st in STUDENTS:
        r_st = p_meta.add_run(f"   •  {st['name']:<22} - MSSV: {st['mssv']} ({st['role']})\n")
        r_st.font.name = 'Times New Roman'
        r_st.font.size = Pt(13)
        r_st.font.color.rgb = RGBColor(30, 41, 59)
        
    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_loc.paragraph_format.space_before = Pt(40)
    r_loc = p_loc.add_run(LOCATION_DATE)
    r_loc.font.name = 'Times New Roman'
    r_loc.font.size = Pt(13)
    r_loc.font.italic = True
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # LỜI NÓI ĐẦU / LỜI CẢM ƠN
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "LỜI NÓI ĐẦU")
    for para in PREFACE_TEXT:
        add_body_paragraph(doc, para)
        
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # DANH MỤC TỪ VIẾT TẮT
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "DANH MỤC TỪ VIẾT TẮT")
    abbr_table_def = {
        "caption": "Bảng Danh mục các từ viết tắt và thuật ngữ chuyên ngành trong đồ án",
        "headers": ["Từ viết tắt", "Thuật ngữ tiếng Anh đầy đủ", "Ý nghĩa giải thích trong hệ thống"],
        "rows": [[abbr[0], abbr[1], abbr[2]] for abbr in ABBREVIATIONS]
    }
    add_custom_table(doc, abbr_table_def, [Inches(1.2), Inches(2.6), Inches(2.8)])
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # MỤC LỤC
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "MỤC LỤC")
    for item, page in TABLE_OF_CONTENTS_LIST:
        p_toc = doc.add_paragraph()
        p_toc.paragraph_format.space_before = Pt(2)
        p_toc.paragraph_format.space_after = Pt(2)
        r_item = p_toc.add_run(item)
        r_item.font.name = 'Times New Roman'
        r_item.font.size = Pt(12)
        if item.startswith("CHƯƠNG") or item in ["LỜI NÓI ĐẦU", "DANH MỤC TỪ VIẾT TẮT", "MỤC LỤC", "MỤC LỤC BẢNG", "MỤC LỤC HÌNH", "TÀI LIỆU THAM KHẢO"]:
            r_item.font.bold = True
            r_item.font.color.rgb = RGBColor(2, 132, 199) if item.startswith("CHƯƠNG") else RGBColor(15, 23, 42)
        else:
            r_item.font.color.rgb = RGBColor(30, 41, 59)
            
        dots_count = max(5, 75 - len(item))
        r_dots = p_toc.add_run(" " + "." * dots_count + " ")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(11)
        r_dots.font.color.rgb = RGBColor(148, 163, 184)
        
        r_page = p_toc.add_run(page)
        r_page.font.name = 'Times New Roman'
        r_page.font.size = Pt(12)
        r_page.font.bold = True
        r_page.font.color.rgb = RGBColor(15, 23, 42)
        
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # MỤC LỤC BẢNG
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "MỤC LỤC BẢNG")
    for tbl_id, tbl_name, page in TABLE_LIST:
        p_tb = doc.add_paragraph()
        p_tb.paragraph_format.space_before = Pt(2)
        p_tb.paragraph_format.space_after = Pt(2)
        r_id = p_tb.add_run(f"{tbl_id} - ")
        r_id.font.name = 'Times New Roman'
        r_id.font.size = Pt(12)
        r_id.font.bold = True
        r_id.font.color.rgb = RGBColor(3, 105, 161)
        
        r_name = p_tb.add_run(tbl_name)
        r_name.font.name = 'Times New Roman'
        r_name.font.size = Pt(12)
        r_name.font.color.rgb = RGBColor(30, 41, 59)
        
        dots_count = max(5, 70 - len(tbl_name) - len(tbl_id))
        r_dots = p_tb.add_run(" " + "." * dots_count + " ")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(11)
        r_dots.font.color.rgb = RGBColor(148, 163, 184)
        
        r_page = p_tb.add_run(page)
        r_page.font.name = 'Times New Roman'
        r_page.font.size = Pt(12)
        r_page.font.bold = True
        
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # MỤC LỤC HÌNH
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "MỤC LỤC HÌNH")
    for fig_id, fig_name, page in FIGURE_LIST:
        p_fg = doc.add_paragraph()
        p_fg.paragraph_format.space_before = Pt(2)
        p_fg.paragraph_format.space_after = Pt(2)
        r_id = p_fg.add_run(f"{fig_id} - ")
        r_id.font.name = 'Times New Roman'
        r_id.font.size = Pt(12)
        r_id.font.bold = True
        r_id.font.color.rgb = RGBColor(3, 105, 161)
        
        r_name = p_fg.add_run(fig_name)
        r_name.font.name = 'Times New Roman'
        r_name.font.size = Pt(12)
        r_name.font.color.rgb = RGBColor(30, 41, 59)
        
        dots_count = max(5, 70 - len(fig_name) - len(fig_id))
        r_dots = p_fg.add_run(" " + "." * dots_count + " ")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(11)
        r_dots.font.color.rgb = RGBColor(148, 163, 184)
        
        r_page = p_fg.add_run(page)
        r_page.font.name = 'Times New Roman'
        r_page.font.size = Pt(12)
        r_page.font.bold = True
        
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI")
    parse_and_add_content(doc, CH1_CONTENT)
    add_custom_table(doc, TABLE_1_1, [Inches(1.5), Inches(1.5), Inches(1.2), Inches(1.2), Inches(1.2)])
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ ÁP DỤNG
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ ÁP DỤNG")
    parse_and_add_content(doc, CH2_CONTENT)
    
    add_image_figure(doc, 'fig_clean_architecture.png', 'Hình 2.1: Mô hình kiến trúc phần mềm Clean Architecture 4 tầng của UniMind', 6.0)
    add_custom_table(doc, TABLE_2_1, [Inches(1.8), Inches(2.4), Inches(2.4)])
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # CHƯƠNG 3: NỘI DUNG THỰC HIỆN VÀ PHÂN TÍCH THIẾT KẾ HỆ THỐNG
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "CHƯƠNG 3: NỘI DUNG THỰC HIỆN VÀ PHÂN TÍCH THIẾT KẾ HỆ THỐNG")
    parse_and_add_content(doc, CH3_CONTENT)
    
    add_heading_2(doc, "3.3 Phân tích và Đặc tả Use Case chi tiết")
    add_body_paragraph(doc, "Dưới đây là 10 bảng đặc tả Use Case chi tiết cho toàn bộ các quy trình nghiệp vụ cốt lõi của hệ thống UniMind, bao gồm thông tin tác nhân, tiền điều kiện, hậu điều kiện, luồng sự kiện chính, luồng phụ và các trường hợp ngoại lệ.")
    
    for uc_tbl in USE_CASE_TABLES:
        add_custom_table(doc, uc_tbl, [Inches(2.0), Inches(4.6)])
        
    add_heading_2(doc, "3.4 Sơ đồ hoạt động hệ thống (Activity Diagrams & Workflows)")
    add_heading_3(doc, "3.4.1 Quy trình ghi nhận nhật ký cảm xúc và AI tư vấn")
    add_body_paragraph(doc, "Khi sinh viên gửi bài nhật ký, hệ thống thực hiện luồng xử lý bất đồng bộ: lưu bài viết vào CSDL -> chuyển văn bản tới Google Gemini AI -> phân loại cảm xúc 4 mức độ -> sinh phản hồi đồng cảm -> cập nhật kết quả và hiển thị lên màn hình sinh viên.")
    
    add_heading_3(doc, "3.4.2 Quy trình chống trùng ca hẹn (Anti-Double-Booking Constraint)")
    add_body_paragraph(doc, "Để triệt tiêu hoàn toàn rủi ro trùng lịch (Race Condition), hệ thống thiết lập cơ chế khóa kép (Dual-locking mechanism): Ở tầng Application, dịch vụ AppointmentService kiểm tra trạng thái IsBooked của TimeSlot; ở tầng CSDL, ràng buộc duy nhất UQ_Appointments_TimeSlot ngăn chặn bất kỳ hành vi ghi đè nào ở mức độ transaction.")
    
    add_heading_3(doc, "3.4.3 Quy trình kiểm soát Zero-Trust vào phòng SafeRoom trực tuyến")
    add_body_paragraph(doc, "Phòng tư vấn trực tuyến SafeCall không yêu cầu mã mời hoặc mật khẩu phòng rườm rà. Thay vào đó, hệ thống tự động kiểm tra định danh người dùng: Nếu CurrentUserId == Appointment.StudentId hoặc CurrentUserId == Appointment.ExpertId, người dùng mới được phép kết nối luồng WebRTC; ngược lại, hệ thống lập tức từ chối với mã lỗi 403 Forbidden.")
    
    add_heading_2(doc, "3.5 Thiết kế Cơ sở dữ liệu (Database Design & ERD)")
    add_body_paragraph(doc, "Hệ thống UniMind sử dụng cơ sở dữ liệu quan hệ SQL Server với 12 bảng thực thể nghiệp vụ cốt lõi, đảm bảo chuẩn hóa dữ liệu ở mức dạng chuẩn 3 (3NF) và tuân thủ các ràng buộc toàn vẹn tham chiếu nghiêm ngặt.")
    
    for dt_tbl in DATA_DICTIONARY_TABLES:
        add_custom_table(doc, dt_tbl)
        
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # CHƯƠNG 4: HIỆN THỰC VÀ ĐÓNG GÓI SẢN PHẨM
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "CHƯƠNG 4: HIỆN THỰC VÀ ĐÓNG GÓI SẢN PHẨM")
    parse_and_add_content(doc, CH4_CONTENT)
    
    # Add actual screenshots of the product
    add_heading_3(doc, "Hình ảnh minh họa giao diện Phân hệ Sinh viên")
    add_image_figure(doc, 'fig_journal_history_ai.png', 'Hình 4.1: Giao diện Bảng điều khiển sinh viên và Lịch sử nhật ký phân loại 4 mức cảm xúc AI', 6.0)
    add_image_figure(doc, 'fig_journal_creation.png', 'Hình 4.2: Giao diện Viết nhật ký cảm xúc và Lời khuyên thấu cảm từ UniMind AI', 6.0)
    add_image_figure(doc, 'fig_dass21_test.png', 'Hình 4.3: Giao diện Thực hiện bài trắc nghiệm tâm lý chuẩn hóa DASS-21', 6.0)
    add_image_figure(doc, 'fig_community_feed.png', 'Hình 4.4: Giao diện Góc chia sẻ ẩn danh cộng đồng sinh viên UniMind', 6.0)
    add_image_figure(doc, 'fig_appointment_booking.png', 'Hình 4.5: Giao diện Đặt lịch hẹn tham vấn tâm lý trực tuyến và trực tiếp', 6.0)
    
    add_heading_3(doc, "Hình ảnh minh họa giao diện Phân hệ Chuyên viên tâm lý")
    add_image_figure(doc, 'fig_expert_workspace_3col.png', 'Hình 4.6: Bàn làm việc Chuyên viên (Workspace) bố cục 3 cột cân đối: Hôm nay, Chờ duyệt, Lịch sắp tới', 6.0)
    add_image_figure(doc, 'fig_expert_timetable.png', 'Hình 4.7: Thời khóa biểu tham vấn trong tuần của chuyên viên kết nối 100% cơ sở dữ liệu thực tế', 6.0)
    add_image_figure(doc, 'fig_safecall_meeting.png', 'Hình 4.8: Giao diện Phòng tư vấn trực tuyến SafeRoom (SafeCall WebRTC) tích hợp thông báo Gmail', 6.0)
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # CHƯƠNG 5: THỬ NGHIỆM, ĐÁNH GIÁ ĐỘ CHÍNH XÁC VÀ KẾT QUẢ
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "CHƯƠNG 5: THỬ NGHIỆM, ĐÁNH GIÁ ĐỘ CHÍNH XÁC VÀ KẾT QUẢ")
    parse_and_add_content(doc, CH5_CONTENT)
    
    # 5.1 Tables and figures for Confusion Matrix & Metrics
    add_custom_table(doc, TABLE_5_1, [Inches(1.8), Inches(0.9), Inches(0.9), Inches(1.1), Inches(1.1), Inches(1.2)])
    add_image_figure(doc, 'fig_confusion_matrix.png', 'Hình 5.1: Biểu đồ nhiệt Ma trận nhầm lẫn (Confusion Matrix) phân loại 4 cấp độ cảm xúc', 5.6)
    
    add_custom_table(doc, TABLE_5_2, [Inches(1.8), Inches(1.2), Inches(1.2), Inches(1.2), Inches(1.2)])
    add_image_figure(doc, 'fig_ai_metrics_barchart.png', 'Hình 5.2: Biểu đồ so sánh Precision, Recall và F1-Score giữa 4 mức độ cảm xúc', 5.6)
    
    add_custom_table(doc, TABLE_5_3, [Inches(2.0), Inches(1.8), Inches(1.0), Inches(2.0)])
    
    # 5.2 Performance testing tables and charts
    add_custom_table(doc, TABLE_5_4, [Inches(1.6), Inches(0.9), Inches(0.9), Inches(0.9), Inches(0.9), Inches(0.8), Inches(1.0)])
    add_image_figure(doc, 'fig_performance_latency.png', 'Hình 5.3: Biểu đồ thời gian đáp ứng API theo mức độ người dùng ảo đồng thời (k6 Load Test)', 5.6)
    
    # 5.3 Functional testing and SUS Survey
    add_custom_table(doc, TABLE_5_5, [Inches(0.8), Inches(1.2), Inches(1.5), Inches(1.5), Inches(1.2), Inches(0.8)])
    add_custom_table(doc, TABLE_5_6, [Inches(0.6), Inches(4.2), Inches(1.0), Inches(1.0)])
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN")
    parse_and_add_content(doc, CH6_CONTENT)
    
    doc.add_page_break()
    
    # ══════════════════════════════════════════════════════════════════
    # TÀI LIỆU THAM KHẢO
    # ══════════════════════════════════════════════════════════════════
    add_heading_1(doc, "TÀI LIỆU THAM KHẢO")
    for ref in REFERENCES_LIST:
        p_ref = doc.add_paragraph(style='Normal')
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.left_indent = Inches(0.3)
        p_ref.paragraph_format.first_line_indent = Inches(-0.3)
        p_ref.paragraph_format.space_before = Pt(3)
        p_ref.paragraph_format.space_after = Pt(4)
        r = p_ref.add_run(ref)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(15, 23, 42)
        
    print(f"Saving final report to {OUTPUT_PATH}...")
    doc.save(OUTPUT_PATH)
    print(f"Successfully generated graduation report: {OUTPUT_PATH}")

if __name__ == '__main__':
    build_report()
