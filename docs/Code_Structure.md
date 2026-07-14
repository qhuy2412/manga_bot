# Cấu trúc Thư mục Dự án (Monorepo Code Structure)
**Dự án:** Hệ thống Web Đọc Truyện & Quản lý Bot Crawl Data (MangaBot)  
**Phiên bản:** 1.0 (Bản đặc tả cấu trúc code chính thức V4.7)  
**Ngày cập nhật:** 2026-07-13

---

## 1. Tổng quan cấu trúc Monorepo
Dự án được cấu trúc dưới dạng Monorepo để dễ dàng chia sẻ Mongoose Models, Helpers và Configurations giữa API Server và Crawl Worker.

```
mangabot/
│
├── packages/                         ← Thư viện/Cấu trúc dùng chung
│   └── database/                     ← Quản lý Mongoose Connection & Models
│       ├── src/
│       │   ├── models/               ← Các Mongoose Schemas dùng chung
│       │   │   ├── crawl-source.ts
│       │   │   ├── bot-config.ts
│       │   │   ├── story.ts
│       │   │   ├── chapter.ts
│       │   │   ├── crawl-log.ts
│       │   │   └── genre.ts
│       │   └── index.ts              ← Export Models & Connection Helpers
│       ├── package.json
│       └── tsconfig.json
│
├── apps/                             ← Các ứng dụng chạy độc lập
│   │
│   ├── api-server/                   ← Express/NestJS REST API Server
│   │   ├── src/
│   │   │   ├── config/               ← Biến môi trường & cấu hình hệ thống
│   │   │   ├── modules/              ← Nhóm modules nghiệp vụ (Admin & Public)
│   │   │   │   ├── auth/
│   │   │   │   ├── stories/
│   │   │   │   ├── chapters/
│   │   │   │   ├── genres/
│   │   │   │   ├── sources/
│   │   │   │   ├── bot-configs/
│   │   │   │   ├── crawl-jobs/       ← POST trigger cào thủ công
│   │   │   │   └── crawl-logs/       ← GET logs cào truyện
│   │   │   ├── internal/             ← Nhóm module nghiệp vụ dành riêng cho Worker
│   │   │   │   ├── stories/
│   │   │   │   ├── bot-configs/
│   │   │   │   ├── chapters/
│   │   │   │   └── logs/
│   │   │   ├── middlewares/          ← auth.ts (JWT), internal.ts (X-Token)
│   │   │   └── server.ts             ← Khởi động Express Server
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── crawler/                      ← Node.js Crawl Worker (Stateless)
│       ├── src/
│       │   ├── worker.ts             ← Main Entry: Consumer BullMQ
│       │   ├── config/               ← Validate env của crawler
│       │   ├── cron/
│       │   │   └── scheduler.ts      ← Quét cron định kỳ để kích hoạt job
│       │   ├── handlers/             ← Các điều phối viên tác vụ cào
│       │   │   ├── full-crawl.ts     ← Handler cào toàn bộ danh mục truyện
│       │   │   └── smart-crawl.ts    ← Handler quét cập nhật và tự sửa lỗi
│       │   ├── extraction/           ← Tầng bóc tách dữ liệu DOM
│       │   │   ├── dom-parser.ts     ← Cheerio parsing
│       │   │   ├── browser.ts        ← Puppeteer browser wrapper
│       │   │   └── strategies/       ← Chiến lược khám phá chương (Strategy)
│       │   │       ├── interface.ts
│       │   │       ├── chapter-list.strategy.ts
│       │   │       ├── follow-next.strategy.ts
│       │   │       └── factory.ts        ← DiscoveryFactory chọn chiến lược
│       │   ├── pipeline/             ← Tầng xử lý luồng dữ liệu & tối ưu hóa
│       │   │   ├── processors/       ← Xử lý nội dung Comic vs Novel
│       │   │   │   ├── interface.ts
│       │   │   │   ├── comic.processor.ts
│       │   │   │   ├── novel.processor.ts
│       │   │   │   └── factory.ts    ← ContentProcessorFactory chọn processor
│       │   │   └── image.ts          ← Sharp xử lý nén ảnh .webp
│       │   └── api-client/
│       │       ├── client.ts         ← Axios wrapper (gắn token nội bộ)
│       │       └── repositories.ts   ← Chứa hàm gọi REST API sang Server
│       ├── package.json
│       └── tsconfig.json
│
└── docs/                             ← Tài liệu thiết kế hệ thống
    ├── SRS.md                        ← Đặc tả Yêu cầu Phần mềm
    ├── SDS.md                        ← Đặc tả Thiết kế, Kiến trúc & Luồng cào
    ├── API_Specification.md          ← Đặc tả REST API chi tiết dạng bảng cột
    ├── Database_Design.md            ← Sơ đồ ERD & Đặc tả Schema CSDL
    └── Code_Structure.md             ← Cấu trúc thư mục Monorepo (File này)
```

---

## 2. Giải thích chi tiết các thư mục chính

### 2.1 `packages/database`
Thư viện quản lý kết nối MongoDB và các Mongoose Models dùng chung cho toàn bộ dự án. Việc định nghĩa Models tại một phân hệ riêng giúp tránh hiện tượng không đồng bộ schema giữa API Server (nơi lưu) và Crawler (nơi gửi dữ liệu lưu).

### 2.2 `apps/api-server`
Đóng vai trò là API Gateway duy nhất. Mọi thao tác CRUD dữ liệu đều đi qua đây để đảm bảo xác thực (JWT cho Admin, X-Internal-Token cho Crawler) và kiểm duyệt dữ liệu trước khi lưu vào MongoDB Atlas.

### 2.3 `apps/crawler`
Ứng dụng Crawler chạy nền không trạng thái (stateless) chịu trách nhiệm cào truyện. Worker được viết bằng Node.js kết hợp Puppeteer (bóc tách các trang dùng lazy-load) và Cheerio (tải nhanh các trang HTML tĩnh). Worker sử dụng hàng đợi BullMQ chạy trên Redis để đảm bảo tác vụ cào không bị mất mát khi gặp sự cố đột ngột.
