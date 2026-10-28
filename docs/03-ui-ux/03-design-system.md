# 03. DESIGN SYSTEM & EMOTIONAL UX GUIDELINES
**Tài liệu theo chuẩn Sổ tay Quy trình AI Agent Web App 15 bước — B | Bước 09**  
**Dự án:** UniMind — Nền tảng Nhật ký Cảm xúc & Hỗ trợ Tư vấn Tâm lý Ẩn danh Dành cho Sinh viên  
**Học phần:** Phát triển Ứng dụng (PTUD) — ĐH Lạc Hồng  

---

## 1. Triết lý Thiết kế: "Tranquil & Empathetic" (Bình yên & Thấu cảm)
Giao diện UniMind hướng đến việc xoa dịu cảm xúc, mang lại cảm giác bình an, an toàn và tin cậy cho sinh viên khi đối diện với các khủng hoảng tâm lý. Thiết kế tránh hoàn toàn các gam màu đỏ rực hoặc độ tương phản gay gắt gây hoảng loạn, thay vào đó sử dụng tông màu pastel dịu mát kết hợp phong cách **Glassmorphism** thanh thoát.

---

## 2. Bảng Màu Cảm Xúc (Emotional Color Palette)

| Mã màu / Token | Tên màu | Giá trị HEX | Ý nghĩa tâm lý & Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `--color-primary` | Calm Cyan / Teal | `#0d9488` / `#14b8a6` | Màu chủ đạo: Tạo cảm giác tin cậy, vững chãi và phục hồi năng lượng. |
| `--color-accent` | Soft Indigo | `#6366f1` | Màu phụ trợ: Sử dụng cho các điểm nhấn tư vấn, trí tuệ và sự đồng hành. |
| `--color-mood-great` | Sunbeam Amber | `#f59e0b` | Trạng thái "Tuyệt vời": Ấm áp, tràn đầy sinh khí và niềm vui. |
| `--color-mood-peaceful`| Emerald Sage | `#10b981` | Trạng thái "Bình yên": Tươi mới, cân bằng, nhẹ nhàng. |
| `--color-mood-stressed`| Sunset Orange | `#f97316` | Trạng thái "Căng thẳng": Cảnh báo nhẹ nhàng, cần thư giãn. |
| `--color-mood-exhausted`| Rainy Slate | `#64748b` | Trạng thái "Mệt mỏi": Trầm lắng, đồng cảm, cần nghỉ ngơi. |
| `--color-mood-sad` | Mist Indigo | `#3b82f6` | Trạng thái "Buồn bã": Lắng đọng, xoa dịu nỗi buồn. |
| `--color-crisis` | Gentle Crimson | `#ef4444` | Báo động đỏ khẩn cấp: Chỉ dùng cho thẻ SOS và đường dây nóng hỗ trợ. |
| `--color-bg-base` | Pure Soft White | `#f8fafc` | Nền ứng dụng: Giúp mắt thư giãn khi đọc bài thời gian dài. |

---

## 3. Kiểu chữ (Typography)
- **Font chữ chính:** `Inter`, `Be Vietnam Pro` (Google Fonts), sans-serif.
- **Tỉ lệ phân cấp (Type Scale):**
  - **H1 (Tiêu đề trang):** 28px — 32px, Font-weight: 700, Line-height: 1.25.
  - **H2 (Tiêu đề phân đoạn):** 20px — 24px, Font-weight: 600, Line-height: 1.35.
  - **H3 (Thẻ & Tiêu đề phụ):** 16px — 18px, Font-weight: 600, Line-height: 1.4.
  - **Body Text (Nội dung bài viết):** 14px — 15px, Font-weight: 400, Line-height: 1.6 (khoảng cách dòng rộng rãi giúp dễ đọc).
  - **Caption / Meta:** 12px — 13px, Font-weight: 400, Color: `#64748b`.

---

## 4. Hiệu ứng Chiều sâu & Glassmorphism
- **Card Background:** `background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(226, 232, 240, 0.8);`
- **Box Shadow:**
  - `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)`
  - `shadow-xl (Floating Banner)`: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`

---

## 5. Vi cử động (Micro-animations) & Tương tác
1. **Pulse Animation:** Hiệu ứng nhịp đập nhẹ nhàng quanh banner nổi thông báo cuộc họp SafeCall để thu hút chú ý mà không gây khó chịu.
2. **Breathing Guide Circle:** Vòng tròn thở nhịp nhàng mở rộng 4 giây (hít vào), giữ 7 giây và thu hẹp 8 giây (thở ra) tại trang nhật ký.
3. **Smooth Tab Transitions:** Chuyển đổi giữa 3 tab bài test DASS-21, PHQ-9, GAD-7 mượt mà với thời gian trượt `cubic-bezier(0.4, 0, 0.2, 1) 250ms`.
4. **Heart & Hug Pop:** Khi bấm "Thích" hoặc "Đồng cảm", biểu tượng bung nở nhẹ (`scale(1.25)` -> `scale(1.0)`) mang lại phản hồi xúc cảm tức thì.
