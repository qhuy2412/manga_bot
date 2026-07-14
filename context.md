# MangaBot - Context Handoff for Implementation Phase (V4.8 Final)

Bản tóm tắt này chứa toàn bộ context quan trọng từ giai đoạn Thiết kế (Design Phase). Sử dụng tài liệu này làm kim chỉ nam cốt lõi trong suốt giai đoạn Lập trình (Code Phase).

---

## 1. Tổng quan Dự án (Project Overview)
*   **Mục tiêu:** Xây dựng hệ thống tự động cào (crawl) truyện tranh/chữ từ các nguồn trên web và quản trị tập trung.
*   **Kiến trúc:** All-in-one Monorepo (NPM Workspaces).
*   **Tech Stack:** Node.js, TypeScript, Express (API Server), MongoDB (Mongoose), Redis + BullMQ (Queue), Cloudinary (Image CDN), Cheerio (Scraping), Sharp (Image Processing).
*   **Phân hệ chính:**
    1. **User Portal:** Web đọc truyện (truyện tranh hiển thị dọc, truyện chữ load text sạch).
    2. **Admin Dashboard:** Quản lý Bot, Lịch cào, Truyện và Giám sát hệ thống.
    3. **API Server:** Cổng giao tiếp trung tâm, xử lý DB, cung cấp Public API và Internal API.
    4. **Crawl Worker:** Tiến trình Node.js không trạng thái (stateless) nhận Job từ Redis để cào, xử lý ảnh/chữ và gửi dữ liệu về API Server.

---

## 2. Chiến lược Crawl Cốt lõi: "Chapter-List Discovery & Self-Healing"

Hệ thống KHÔNG dùng cơ chế kiểm duyệt dịch thô rườm rà. Mọi logic cập nhật phụ thuộc vào Hash Change.

### A. Pha 1: Tự động cào mục lục (Chapter-List Discovery)
*   Scheduler đẩy Job `SMART_CRAWL` cho Worker.
*   Worker truy cập URL gốc (trang detail) của truyện, dùng `chapterListSelector` cào danh sách toàn bộ chương.
*   So sánh với DB: Các chương nào chưa có trong DB sẽ được bóc tách và đẩy Job `FETCH_CHAPTER` vào hàng đợi tải ảnh/text.
*   Hệ thống dùng hàm **Upsert** (`POST /api/v1/internal/chapters` với `{ storyId, chapterIndex }` là Unique Compound Index) để ghi đè an toàn, chống duplicate (race condition).

### B. Pha 2: Tự chữa lành (Self-Healing via MD5 Hash)
*   Nếu Bước A không tìm thấy chương mới, Worker kiểm tra Hash của chương cuối cùng.
*   Tải mảng URL ảnh của trang gốc hiện tại, băm ra chuỗi MD5 Hash.
*   So sánh với `latestChapterHash` trong DB:
    *   **Khác nhau:** Nguồn đã cập nhật nội dung thầm lặng (VD: up bản dịch đè bản Raw cũ). Worker lập tức tải ảnh/text mới, nén và gọi API Upsert để ghi đè dữ liệu mới tinh, mang lại bản dịch hoàn chỉnh cho người dùng.
    *   **Giống nhau:** Bỏ qua.

---

## 3. Thiết kế Database & Mở rộng linh hoạt (1:N)

Hệ thống có 7 bảng chính: `users`, `genres`, `crawl_sources`, `bot_configs`, `stories`, `chapters`, `crawl_logs`.

### Các thiết kế đáng chú ý:
*   **Quan hệ 1:N linh hoạt:** Một `bot_configs` (CSS Selectors của 1 layout) có thể được dùng chung cho hàng ngàn `stories`.
*   **Ghi đè ngoại lệ (Override):** Bảng `stories` có trường `selectorOverrides` (JSON). Nếu 1 truyện bị sai layout, Admin có thể điền CSS riêng cho truyện đó mà không cần đẻ thêm Bot Config.
*   **Tối ưu Lịch hẹn (Cron):** Bảng `stories` có chuỗi `cronSchedule`. API Server tự động tính ra ngày giờ cụ thể lưu vào `nextCrawlTime` (có đánh Index) để Scheduler truy vấn cực nhanh mỗi phút bằng `$lte: now`.

---

## 4. Giao tiếp Worker <-> API Server (Security & Rate Limiting)
*   Worker **KHÔNG** cắm thẳng vào MongoDB. Mọi lưu trữ đi qua API Server bằng các Internal Endpoints.
*   **Bảo mật:** Sử dụng Header `X-Internal-Token` được API Server verify bằng hàm so sánh thời gian hằng định (`crypto.timingSafeEqual`) chống Timing Attack.
*   **Rate Limiting:** Sử dụng tính năng giới hạn tốc độ (Rate Limiter) của BullMQ được cấu hình riêng cho từng Queue (mỗi Source 1 queue) để tránh web nguồn block IP.

---

## 5. Smart Alerting & Giám sát Hệ thống
*   Hệ thống liên tục theo dõi log cào. Nếu một `bot_configs` văng lỗi `DOMError` (VD: web đổi giao diện mất thẻ CSS) liên tục quá 10 lần, hệ thống sẽ:
    1. Gửi Webhook cảnh báo (Telegram/Discord) cho Admin.
    2. Tự động tạm tắt (isActive = false) Bot Config đó để ngăn tài nguyên hao phí.

---

## 6. Kế hoạch Code (Implementation Phase)
Hệ thống đã chốt xong toàn bộ tài liệu (SRS Use Cases, SDS ERD, API Specs). Sẵn sàng để khởi tạo cấu trúc Monorepo và bắt đầu lập trình theo kế hoạch.
