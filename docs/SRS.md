# Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS)
**Dự án:** Hệ thống Web Đọc Truyện & Quản lý Bot Crawl Data (MangaBot)  
**Phiên bản:** 1.0 (Bản đặc tả yêu cầu chính thức V4.8)  
**Ngày cập nhật:** 2026-07-13

---

## 1. Giới thiệu (Introduction)

### 1.1 Mục đích tài liệu
Tài liệu này đặc tả chi tiết toàn bộ các yêu cầu nghiệp vụ, yêu cầu chức năng và phi chức năng cho hệ thống đọc truyện và tự động thu thập nội dung **MangaBot**. Tài liệu này đóng vai trò là kim chỉ nam cho thiết kế hệ thống (SDS), lập trình cơ sở dữ liệu và triển khai kiểm thử phần mềm.

### 1.2 Phạm vi hệ thống
Hệ thống MangaBot bao gồm 3 phân hệ chính hoạt động độc lập và giao tiếp qua API/Queue:
1.  **User Portal (Trang đọc truyện):** Cung cấp giao diện đọc truyện chữ (Novel) và truyện tranh (Comic) tốc độ cao, tối ưu hiển thị cho người đọc.
2.  **Admin Dashboard (Trang quản trị):** Giao diện quản lý nguồn truyện, cấu hình Bot cào, quản trị danh mục truyện, lập lịch cào và giám sát logs.
3.  **Crawl Worker (Tiến trình cào nền):** Đóng vai trò là các tiến trình chạy nền không trạng thái (stateless), nhận job từ hàng đợi BullMQ để cào dữ liệu, tối ưu hóa ảnh/chữ và gửi về API Server để lưu.

### 1.3 Thuật ngữ & Từ viết tắt

| Thuật ngữ | Định nghĩa |
|---|---|
| **Source** | Trang web nguồn cung cấp truyện gốc (VD: nettruyennew.com, truyenfull.vn). |
| **Bot Config** | Bộ cấu hình selectors (CSS Selectors) và các quy tắc kiểm duyệt bản dịch cho một Source cụ thể. |
| **Full Crawl** | Luồng cào toàn bộ danh sách chương từ đầu của một bộ truyện mới thêm. |
| **Smart Crawl** | Luồng quét tự động theo lịch hẹn để cập nhật chương mới hoặc tự chữa lành bản thô của truyện. |
| **Chapter-List** | Chiến lược cào: Lấy toàn bộ danh sách link chương từ trang mục lục (detail) trong một request duy nhất. |
| **Follow-Next** | Chiến lược cào: Lần mò theo nút "Chương sau" (Postponed - Dời lại phát triển ở giai đoạn sau). |
| **Worker** | Tiến trình Node.js độc lập nhận job từ Redis Queue để cào, xử lý ảnh/chữ và đẩy lên CDN. |
| **Queue** | Hàng đợi tác vụ sử dụng Redis (BullMQ) để điều phối công việc giữa API Server và các Worker. |
| **CDN URL** | Đường dẫn ảnh đã được lưu trữ và tối ưu hóa trên Cloudinary Content Delivery Network. |
| **Comic** | Thể loại truyện tranh (Nội dung của chương là mảng các CDN URLs ảnh). |
| **Novel** | Thể loại truyện chữ / sách (Nội dung của chương là văn bản HTML đã lọc sạch). |
| **latestChapterHash** | Mã MD5 hash của danh sách link ảnh gốc chương cuối cùng, dùng để phát hiện cập nhật nội dung thầm lặng. |

---

## 2. Mô tả Tổng quan Hệ thống (Overall Description)

### 2.1 Kiến trúc luồng nghiệp vụ tổng quát
Hệ thống hoạt động theo mô hình khép kín:
1.  **Quản trị viên (Admin)** định nghĩa **Nguồn cào (Source)** và thiết lập các CSS Selectors tương ứng trong **Bot Config**.
2.  Khi thêm một **Truyện (Story)**, Admin chọn Bot Config phù hợp và cài đặt tần suất quét tự động (Cron Schedule) cho truyện đó.
3.  Hệ thống kích hoạt **Full Crawl** để lấy toàn bộ dữ liệu lịch sử của truyện.
4.  **Scheduler** tự động quét định kỳ theo cấu hình của từng truyện để đẩy job **Smart Crawl** vào hàng đợi, cập nhật chương mới hoặc cào đè bản dịch chính thức thay thế cho bản thô.
5.  **User Portal** lấy dữ liệu từ DB để phục vụ độc giả đọc truyện chất lượng cao.

### 2.2 Các tác nhân trong hệ thống (Actors)
*   **Độc giả (End User):** Chỉ đọc truyện tranh/chữ trên User Portal, không cần đăng nhập.
*   **Quản trị viên (Admin):** Có toàn quyền truy cập Admin Dashboard để điều khiển Bot, cấu hình selectors, quản lý truyện và theo dõi log.
*   **Hệ thống Scheduler/Worker:** Tiến trình tự động hoạt động theo giờ/phút để thực thi cào dữ liệu mà không cần sự can thiệp trực tiếp của con người.

---

## 3. Yêu cầu Chức năng (Functional Requirements)

### 3.1 Phân hệ User Portal (Đọc truyện)
*   **UR-1.1 Xem danh sách truyện:** Hiển thị danh sách truyện có phân trang, lọc theo thể loại (Genre), lọc theo trạng thái (Ongoing/Completed) và sắp xếp theo lượt xem hoặc thời gian cập nhật.
*   **UR-1.2 Tìm kiếm truyện:** Cho phép tìm kiếm truyện theo tên hoặc tác giả thông qua từ khóa không dấu/có dấu.
*   **UR-1.3 Xem chi tiết truyện:** Hiển thị thông tin mô tả truyện, tác giả, trạng thái, ảnh bìa (load từ CDN) và danh sách chương sắp xếp từ mới nhất hoặc cũ nhất.
*   **UR-1.4 Đọc nội dung chương:**
    *   Đối với **Comic (Truyện tranh):** Hiển thị danh sách ảnh dọc, tải mượt mà từ CDN Cloudinary.
    *   Đối với **Novel (Truyện chữ):** Hiển thị nội dung văn bản sạch, cho phép đổi màu nền, font chữ và kích thước chữ.
*   **UR-1.5 Độc lập CDN:** Hệ thống phải tải ảnh qua referer hợp lệ để bypass cơ chế chặn hotlink của nguồn, sau đó lưu trữ vĩnh viễn trên CDN của dự án để đảm bảo độc giả không bị lỗi ảnh 403 Forbidden.

### 3.2 Phân hệ Admin Dashboard (Đặc tả Use Case Quản trị)

*   **UC-1: Xác thực hệ thống (Authentication)**
    *   **Tác nhân:** Admin
    *   **Điều kiện tiên quyết:** Admin truy cập vào trang đăng nhập của Admin Dashboard.
    *   **Luồng sự kiện chính (Happy Path):**
        1. Admin nhập `username` và `password`.
        2. Admin nhấn nút Đăng nhập.
        3. Hệ thống kiểm tra thông tin hợp lệ, sinh ra JWT Token có thời hạn 24h.
        4. Hệ thống chuyển hướng Admin vào màn hình Dashboard chính.
    *   **Luồng ngoại lệ (Alternate Flow):**
        *   Sai thông tin: Hệ thống báo lỗi "Tài khoản hoặc mật khẩu không chính xác".
    *   **Kết quả:** Admin có quyền truy cập các API quản trị.

*   **UC-2: Quản lý Nguồn cào (Crawl Sources Management)**
    *   **Tác nhân:** Admin
    *   **Điều kiện tiên quyết:** Admin đã đăng nhập.
    *   **Luồng sự kiện chính:**
        1. Admin vào trang Quản lý Sources. Hệ thống hiển thị danh sách các nguồn hiện có.
        2. Admin chọn "Thêm mới", nhập tên nguồn (VD: Nettruyen) và domain. Nhấn Lưu.
        3. Hệ thống lưu vào DB (`crawl_sources`) và hiển thị nguồn mới trên lưới dữ liệu.
        4. Khi nguồn bị chặn IP, Admin vào sửa và gạt công tắc `isActive` sang Tắt (false).
    *   **Luồng ngoại lệ:**
        *   Trùng domain: Hệ thống báo lỗi "Tên miền đã tồn tại".
    *   **Kết quả:** Dữ liệu nguồn được cập nhật. Nếu tắt nguồn, mọi truyện thuộc nguồn này sẽ bị Scheduler bỏ qua.

*   **UC-3: Quản lý Bộ cấu hình Bot (Bot Configs Management)**
    *   **Tác nhân:** Admin
    *   **Điều kiện tiên quyết:** Admin đã thêm ít nhất 1 Source (UC-2) và có CSS Selector từ web nguồn.
    *   **Luồng sự kiện chính:**
        1. Admin vào trang Bot Configs, bấm "Thêm Bot".
        2. Hệ thống hiển thị form nhập liệu. Admin chọn Nguồn từ Dropdown.
        3. Admin nhập `layoutName` (VD: "Nettruyen Mobile"), chọn `botType` (COMIC/NOVEL) và `crawlStrategy`.
        4. Admin dán các CSS Selector (tiêu đề, ảnh, mục lục) vào form.
        5. Admin bấm "Lưu". Hệ thống validate các trường bắt buộc và lưu vào DB (`bot_configs`).
    *   **Luồng ngoại lệ:**
        *   Thiếu trường bắt buộc (VD: không nhập `imageSelector` cho bot COMIC): Hệ thống highlight ô lỗi và từ chối lưu.
    *   **Kết quả:** Bot Config sẵn sàng để tái sử dụng cho các bộ truyện.

*   **UC-4: Quản lý Truyện và Lập lịch cào (Story & Scheduling Management)**
    *   **Tác nhân:** Admin
    *   **Điều kiện tiên quyết:** Đã có Bot Config (UC-3) cho nguồn web tương ứng.
    *   **Luồng sự kiện chính:**
        1. Admin vào trang Truyện, bấm "Thêm truyện mới".
        2. Admin dán URL gốc của truyện (trang mục lục).
        3. Admin chọn một `Bot Config` phù hợp từ danh sách sổ xuống.
        4. (Tùy chọn) Admin nhập chuỗi CSS vào ô `selectorOverrides` nếu truyện bị sai bố cục.
        5. Admin thiết lập biểu thức `cronSchedule` (VD: `*/30 * * * *`). Bật công tắc `isAutoUpdate`.
        6. Admin bấm "Lưu". Hệ thống lưu dữ liệu, sinh `nextCrawlTime` và đẩy truyện vào trạng thái Pending.
    *   **Luồng ngoại lệ:**
        *   Chuỗi Cron không hợp lệ: API từ chối lưu và báo lỗi cú pháp.
    *   **Kết quả:** Truyện được thêm vào DB. Scheduler bắt đầu tự động theo dõi truyện này.

*   **UC-5: Điều khiển tác vụ Cào thủ công (Manual Crawl Trigger)**
    *   **Tác nhân:** Admin
    *   **Điều kiện tiên quyết:** Truyện đã tồn tại trong DB.
    *   **Luồng sự kiện chính:**
        1. Admin xem chi tiết một bộ truyện trên Dashboard.
        2. Admin bấm nút "Full Crawl" (cào toàn bộ từ đầu) hoặc "Smart Crawl" (chỉ cập nhật).
        3. Hệ thống tạo một Job tương ứng đẩy thẳng vào Queue BullMQ (Bỏ qua `nextCrawlTime`).
        4. Giao diện hiển thị thông báo "Đã đẩy Job vào hàng đợi".
    *   **Kết quả:** Worker nhận Job và ngay lập tức thực thi việc cào truyện.

*   **UC-6: Giám sát Hệ thống và Nhật ký (Logs & Monitoring)**
    *   **Tác nhân:** Admin
    *   **Điều kiện tiên quyết:** Có các Job đã hoặc đang chạy.
    *   **Luồng sự kiện chính:**
        1. Admin vào trang Logs. Hệ thống hiển thị lịch sử cào.
        2. Admin lọc các Job bị FAILED. Xem chi tiết thông báo lỗi (VD: `DOMError: Không tìm thấy imageSelector`).
        3. Đối với lỗi Network Timeout, Admin bấm nút "Retry" bên cạnh Log. Hệ thống đẩy lại Job vào Queue.
        4. (Smart Alerting): Nếu hệ thống đếm được 10 lỗi DOMError liên tiếp từ 1 Bot Config, API Server gửi webhook cảnh báo đến Telegram/Discord của Admin.
        5. Admin nhận tin nhắn Telegram, vào Dashboard sửa lại CSS (quay lại UC-3).
    *   **Kết quả:** Admin kiểm soát được sức khỏe hệ thống và xử lý sự cố kịp thời.

### 3.3 Phân hệ Crawl Worker (Thu thập dữ liệu tự động)
*   **UR-3.1 Tự động cào mục lục truyện (Chapter-List Discovery):** Tìm kiếm và trích xuất toàn bộ danh sách URL chương truyện từ trang detail của nguồn cào.
*   **UR-3.2 Xử lý và Tối ưu hóa dữ liệu chương:**
    *   **Comic Pipeline:** Tải ảnh gốc từ nguồn (gắn Referer bypass 403) -> Dùng thư viện Sharp để nén chất lượng giảm dung lượng (chất lượng 75%) và chuyển sang định dạng WebP -> Upload lên Cloudinary CDN -> Lưu danh sách CDN URLs.
    *   **Novel Pipeline:** Tải HTML văn bản -> Bóc tách text -> Dùng Sanitize-HTML để lọc bỏ toàn bộ mã độc, thẻ script và các liên kết quảng cáo của nguồn cào, chỉ giữ lại định dạng văn bản đọc truyện cơ bản (`<p>`, `<br>`, `<b>`, `<i>`).
*   **UR-3.3 Tự động cào đè sửa lỗi (Self-Healing via Hash Change):**
    *   Nếu nguồn ban đầu chỉ đăng bản Raw, sau đó đăng bản dịch thay thế mà không đổi tên chương: Hệ thống Smart Crawl so khớp mã MD5 hash của ảnh gốc chương cuối trên nguồn với `latestChapterHash` trong DB.
    *   Nếu mã hash khác nhau -> Worker tự động kích hoạt tải lại ảnh dịch mới để Upsert ghi đè dữ liệu bản Raw cũ trong DB, đảm bảo độc giả luôn tự động được cập nhật bản dịch hoàn chỉnh nhất.

---

## 4. Yêu cầu Phi chức năng (Non-functional Requirements)

### 4.1 Hiệu năng và Khả năng chịu tải (Performance & Concurrency)
*   **Stateless Worker:** Các worker phải chạy độc lập hoàn toàn, không lưu trạng thái trên ổ đĩa cục bộ, cho phép tăng giảm số lượng worker (Auto-scale) dễ dàng khi hàng đợi bị dồn ứ job.
*   **Nén ảnh tối ưu:** Sharp phải giảm dung lượng ảnh tối thiểu 50% so với ảnh gốc mà không làm giảm đáng kể chất lượng hiển thị.

### 4.2 Tính Tin cậy và Khả dụng (Reliability & Availability)
*   **Cơ chế Retry tự động:** Hàng đợi phải tự động đẩy lại các job thất bại do lỗi mạng tạm thời hoặc Cloudinary timeout tối đa 3 lần với cơ chế giãn cách thời gian tăng dần (exponential backoff).
*   **Kháng chặn (Anti-blocking):** Giao thức HTTP request của Worker phải đính kèm Header `Referer` và `User-Agent` mô phỏng trình duyệt thật để tránh bị hệ thống Cloudflare hoặc tường lửa của web nguồn chặn.

### 4.3 Tính Bảo mật (Security)
*   **Xác thực 2 lớp cho API:**
    *   Giao diện Admin Portal bắt buộc xác thực qua token JWT có thời gian hết hạn (24 giờ).
    *   Worker giao tiếp với API Server bắt buộc truyền header `X-Internal-Token` chứa mã khóa bí mật cấu hình trong biến môi trường hệ thống. API Server từ chối mọi request không hợp lệ.
