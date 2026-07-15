# Tài liệu Đặc tả REST API (API Specification)
**Dự án:** Hệ thống Web Đọc Truyện & Quản lý Bot Crawl Data (MangaBot)  
**Phiên bản:** 1.0 (Bản đặc tả API chính thức V4.8)  
**Ngày cập nhật:** 2026-07-13

---

## 1. Quy chuẩn chung (Conventions)

### 1.1 Cấu trúc Response thành công (2xx)
Tất cả các API thành công đều trả về JSON có định dạng:
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `data` | Object / Array | Chứa dữ liệu phản hồi chính của API |
| `meta` | Object (Tùy chọn) | Chứa thông tin bổ sung như phân trang (`total`, `page`, `limit`, `totalPages`) |

### 1.2 Cấu trúc Response lỗi (4xx, 5xx)
Khi xảy ra lỗi, API sẽ phản hồi có dạng:
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `error.code` | String | Mã định danh lỗi chuẩn hóa (VD: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`) |
| `error.message`| String | Thông báo lỗi chi tiết hiển thị cho lập trình viên/người dùng |
| `error.details`| Array (Tùy chọn)| Mảng chi tiết các lỗi kiểm dữ liệu (nếu có) |

---

## 2. Nhóm API Độc giả (Public API)
Các API này phục vụ cho User Portal, không yêu cầu xác thực.

### 2.1 GET `/api/v1/stories` - Lấy danh sách truyện
*   **Mô tả:** Trả về danh sách truyện có lọc và phân trang.
*   **Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả | Default |
|---|---|---|---|---|
| `page` | Number | Không | Trang cần xem | `1` |
| `limit` | Number | Không | Số lượng truyện trên 1 trang | `20` |
| `status` | String | Không | Lọc theo trạng thái: `Ongoing` hoặc `Completed` | - |
| `genre` | String | Không | Lọc theo slug thể loại | - |
| `q` | String | Không | Tìm kiếm theo tiêu đề truyện hoặc tác giả | - |

*   **Response Body (`data` array fields):**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID truyện (ObjectId) |
| `title` | String | Tên truyện |
| `slug` | String | URL slug thân thiện |
| `coverImage` | String | Link ảnh bìa (CDN WebP URL) |
| `author` | String | Tác giả truyện |
| `status` | String | Trạng thái truyện (`Ongoing`, `Completed`) |
| `views` | Number | Tổng số lượt xem |
| `updatedAt` | DateString | Thời gian cập nhật cuối cùng |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": [
    {
      "id": "64abc123e4b0c9a123456789",
      "title": "Một Kiếp Nhân Sinh",
      "slug": "mot-kiep-nhan-sinh",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/mot-kiep.webp",
      "author": "Nam Vô Ưu",
      "status": "Ongoing",
      "views": 1500,
      "updatedAt": "2026-07-13T02:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 2.2 GET `/api/v1/stories/:slug` - Chi tiết bộ truyện
*   **Mô tả:** Lấy thông tin metadata đầy đủ của truyện dựa trên slug.
*   **Path Parameters:**
| Tham số | Kiểu | Mô tả |
|---|---|---|
| `slug` | String | URL slug thân thiện của truyện (VD: `mot-kiep-nhan-sinh`) |

*   **Response Body (`data` fields):**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID truyện (ObjectId) |
| `title` | String | Tên truyện |
| `slug` | String | Slug thân thiện |
| `author` | String | Tác giả truyện |
| `description`| String | Tóm tắt truyện |
| `coverImage` | String | Link CDN ảnh bìa |
| `status` | String | Trạng thái truyện |
| `views` | Number | Tổng lượt xem |
| `genres` | Array | Mảng tên các thể loại |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "id": "64abc123e4b0c9a123456789",
    "title": "Một Kiếp Nhân Sinh",
    "slug": "mot-kiep-nhan-sinh",
    "author": "Nam Vô Ưu",
    "description": "Câu chuyện kể về cuộc phiêu lưu kì bí...",
    "coverImage": "https://res.cloudinary.com/demo/image/upload/mot-kiep.webp",
    "status": "Ongoing",
    "views": 1500,
    "genres": ["Tiên Hiệp", "Huyền Huyễn"]
  }
}
```

---

### 2.3 GET `/api/v1/stories/:storyId/chapters` - Danh sách chương truyện
*   **Mô tả:** Lấy danh sách toàn bộ chương của một bộ truyện theo ID.
*   **Path Parameters:**
| Tham số | Kiểu | Mô tả |
|---|---|---|
| `storyId` | String | ID truyện cần lấy chương |

*   **Response Body (`data` array fields):**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID chương (ObjectId) |
| `chapterName`| String | Tên chương (VD: `Chương 1: Khởi Đầu`) |
| `chapterIndex`| Number| Số thứ tự chương dùng để sắp xếp |
| `createdAt` | DateString| Ngày cào chương |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": [
    {
      "id": "65def001e4b0c9a987654321",
      "chapterName": "Chương 1: Khởi Đầu",
      "chapterIndex": 1,
      "createdAt": "2026-07-13T02:10:00.000Z"
    }
  ]
}
```

---

### 2.4 GET `/api/v1/chapters/:chapterId` - Đọc nội dung chương truyện
*   **Mô tả:** Lấy nội dung đọc của chương truyện (Comic hoặc Novel).
*   **Path Parameters:**
| Tham số | Kiểu | Mô tả |
|---|---|---|
| `chapterId` | String | ID chương cần đọc |

*   **Response Body (`data` fields):**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID chương |
| `storyId` | String | ID truyện chứa chương này |
| `chapterName`| String | Tên chương |
| `chapterIndex`| Number| Số thứ tự chương |
| `images` | Array | Mảng CDN URLs ảnh (Chỉ dành cho truyện tranh `COMIC`, truyện chữ trả về `null`) |
| `content` | String | Văn bản HTML sạch (Chỉ dành cho truyện chữ `NOVEL`, truyện tranh trả về `null`) |

*   **Phản hồi mẫu (200 OK - Cho COMIC):**
```json
{
  "data": {
    "id": "65def001e4b0c9a987654321",
    "storyId": "64abc123e4b0c9a123456789",
    "chapterName": "Chapter 1: Tiến Lên",
    "chapterIndex": 1,
    "images": [
      "https://res.cloudinary.com/demo/image/upload/chap1_p1.webp",
      "https://res.cloudinary.com/demo/image/upload/chap1_p2.webp"
    ],
    "content": null
  }
}
```

*   **Phản hồi mẫu (200 OK - Cho NOVEL):**
```json
{
  "data": {
    "id": "65def002e4b0c9a987654322",
    "storyId": "64abc123e4b0c9a123456789",
    "chapterName": "Chương 1: Khởi Đầu",
    "chapterIndex": 1,
    "images": null,
    "content": "<p>Đêm đen như mực...</p><p>Hắn lẳng lặng đứng bên vách đá...</p>"
  }
}
```

---

### 2.5 GET `/api/v1/genres` - Lấy danh sách thể loại
*   **Mô tả:** Trả về danh sách thể loại truyện trong hệ thống.
*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": [
    {
      "id": "64abc999e4b0c9a000111222",
      "name": "Tiên Hiệp",
      "slug": "tien-hiep",
      "description": "Thể loại tu luyện tiên nhân"
    }
  ]
}
```

---

## 3. Nhóm API Quản trị (Admin API)
Các API này yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.

### 3.1 POST `/api/v1/admin/auth/login` - Đăng nhập quản trị
*   **Mô tả:** Đăng nhập hệ thống, nhận JWT Token. Không yêu cầu Header Auth.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `username` | String | Có | Tên tài khoản Admin |
| `password` | String | Có | Mật khẩu tài khoản |

*   **Response Body (`data` fields):**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `token` | String | JWT Token dùng để đính kèm vào các requests Admin sau |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3.2 POST `/api/v1/admin/bot-configs` - Tạo mới bộ cấu hình Bot cào
*   **Mô tả:** Tạo mới bộ CSS selectors và quy tắc kiểm duyệt nội dung cho nguồn cào.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `layoutName` | String | Có | Tên gợi nhớ layout cấu hình (VD: `Dilib Mobile`) |
| `titleSelector` | String | Có | Selector bóc tiêu đề truyện tại trang detail |
| `authorSelector` | String | Không | Selector bóc tác giả truyện |
| `descriptionSelector`| String| Không | Selector bóc tóm tắt truyện |
| `coverSelector` | String | Không | Selector bóc link ảnh bìa |
| `chapterListSelector`| String| Có | Selector bóc mảng thẻ chứa link chương (Bắt buộc) |
| `imageSelector` | String | Có | Selector bóc mảng ảnh chương đọc (Bắt buộc) |

*   **Phản hồi mẫu (201 Created):**
```json
{
  "data": {
    "id": "64abc888e4b0c9a333333333",
    "layoutName": "Dilib Mobile"
  }
}
```

---

### 3.3 CRUD `/api/v1/admin/stories` - Quản lý Truyện (Stories)
*   **Mô tả:** API thêm mới, sửa, xóa truyện. (Thường dùng để add truyện thủ công trước khi cào).
*   **Request Body (POST/PUT):**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `botConfigId` | String | Có | ID của Bot Config |
| `sourceUrl` | String | Có | URL gốc của truyện |
| `cronSchedule`| String | Không | Lịch cào tự động (VD: `*/30 * * * *`) |
| `isAutoUpdate`| Boolean| Không | Bật/tắt cào tự động |
| `selectorOverrides`| Object| Không | Ghi đè CSS Selector cho riêng truyện này (VD: `{imageSelector: ".custom"}`) |

*   **Phản hồi mẫu (201 Created):**
```json
{
  "data": {
    "id": "64abc123e4b0c9a123456789",
    "title": "Naruto",
    "status": "Pending"
  }
}
```

---

### 3.4 POST `/api/v1/admin/crawl-jobs/trigger` - Kích hoạt cào truyện thủ công (Full Crawl)
*   **Mô tả:** Thêm một bộ truyện và đẩy Job khám phá chương (Discovery) vào Queue BullMQ.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `storyUrl` | String | Có | URL gốc trang chi tiết của bộ truyện trên trang nguồn |
| `botConfigId` | String | Có | ID cấu hình Bot selectors tương ứng để cào truyện này |
| `cronSchedule` | String | Không | Lịch quét tự động dạng Cron (VD: `*/30 * * * *`). Nếu trống sẽ cào thủ công. |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "storyId": "64abc123e4b0c9a123456789",
    "message": "Job cào đã được đẩy vào hàng đợi thành công"
  }
}
```

---

### 3.5 GET `/api/v1/admin/logs` - Giám sát lịch sử cào truyện (Crawl Logs)
*   **Mô tả:** Xem log cào truyện phục vụ Debug lỗi.
*   **Query Parameters:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `page` | Number | Không | Trang cần xem (Default: `1`) |
| `limit` | Number | Không | Số dòng hiển thị (Default: `20`) |
| `status` | String | Không | Lọc trạng thái log: `SUCCESS` hoặc `FAILED` |
| `storyId` | String | Không | Lọc log của một bộ truyện cụ thể |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": [
    {
      "id": "64abc111e4b0c9a999999999",
      "storyId": "64abc123e4b0c9a123456789",
      "botConfigId": "64abc888e4b0c9a333333333",
      "jobType": "FULL_CRAWL",
      "targetUrl": "https://nettruyennew.com/truyen-tranh/naruto",
      "status": "FAILED",
      "errorMessage": "Timeout 10000ms khi tải ảnh trang nguồn",
      "crawledItems": 0,
      "executionTimeMs": 10500,
      "createdAt": "2026-07-13T02:20:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 4. Nhóm API Nội bộ (Internal API - Dành cho Worker)
Các API này yêu cầu Header `X-Internal-Token: <SECRET_STRING>` cấu hình trong `.env`. Token được so khớp bằng hàm constant-time để chống Timing Attack. Cần cấu hình Firewall chặn truy cập từ bên ngoài, chỉ cho phép từ mạng nội bộ (localhost/VPC).

### 4.1 GET `/api/v1/internal/stories/due` - Quét danh sách truyện đến hạn cập nhật
*   **Mô tả:** Dành cho Scheduler chạy mỗi phút quét các truyện cần cào tự động.
*   **Response Body (`data` array fields):**
| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID truyện (ObjectId) |
| `slug` | String | Slug truyện |
| `sourceUrl` | String | URL trang detail của truyện ở nguồn |
| `lastChapterUrl` | String | URL trang đọc chương cuối trong DB |
| `latestChapterHash`| String| MD5 hash chương cuối trong DB |
| `botConfigId` | String | ID cấu hình selectors của truyện |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": [
    {
      "id": "64abc123e4b0c9a123456789",
      "slug": "naruto",
      "sourceUrl": "https://nettruyennew.com/truyen-tranh/naruto",
      "lastChapterUrl": "https://nettruyennew.com/truyen-tranh/naruto/chap-700",
      "latestChapterHash": "d8e8f9e2e21b2d4187063aa87693d256",
      "botConfigId": "64abc888e4b0c9a333333333"
    }
  ]
}
```

---

### 4.2 PUT `/api/v1/internal/stories/:id` - Cập nhật metadata Truyện (Sau khi Discovery)
*   **Mô tả:** Worker gọi API này để cập nhật Tên truyện, Tác giả, Ảnh bìa, Tóm tắt sau khi cào thành công trang chi tiết.
*   **Path Parameters:**
| Tham số | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID truyện cần cập nhật |

*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | String | Không | Tên truyện cào được |
| `author` | String | Không | Tác giả cào được |
| `description`| String | Không | Tóm tắt truyện cào được |
| `coverImage` | String | Không | URL ảnh bìa cào được |
| `status` | String | Không | Trạng thái truyện (VD: `Ongoing`) |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "id": "64abc123e4b0c9a123456789",
    "title": "Naruto",
    "status": "Ongoing"
  }
}
```

---

### 4.3 GET `/api/v1/internal/bot-configs/:id` - Lấy selectors của Bot
*   **Mô tả:** Lấy nhanh selectors và cấu hình kiểm duyệt để tải chương.
*   **Path Parameters:**
| Tham số | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID bộ cấu hình Bot Config cần lấy |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "id": "64abc888e4b0c9a333333333",
    "botType": "COMIC",
    "imageSelector": ".reading-detail img",
    "rawTitleKeywords": ["raw", "bản thô"],
    "minImagesCount": 5
  }
}
```

---

### 4.4 POST `/api/v1/internal/chapters` - Lưu chương truyện mới cào thành công
*   **Mô tả:** Thực hiện Upsert (Thêm mới hoặc Cập nhật) dựa trên `storyId` và `chapterIndex` để lưu chương sạch, đảm bảo tính Idempotency khi Retry Job.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `storyId` | String | Có | ID truyện chứa chương này |
| `chapterName` | String | Có | Tên chương (VD: `Chapter 701`) |
| `chapterIndex`| Number | Có | Thứ tự chương để sắp xếp |
| `language` | String | Không | Ngôn ngữ chương (Default: `vi`) |
| `images` | Array | Có | Mảng URLs ảnh CDN (Bắt buộc) |
| `sourceUrl` | String | Có | URL gốc của trang đọc chương đó ở nguồn để log |

*   **Phản hồi mẫu (201 Created):**
```json
{
  "data": {
    "id": "65def003e4b0c9a987654323",
    "chapterName": "Chapter 701",
    "chapterIndex": 701
  }
}
```

---

### 4.5 PATCH `/api/v1/internal/chapters/:id` - Cập nhật đè chương (Tự chữa lành)
*   **Mô tả:** Ghi đè ảnh dịch mới thay thế ảnh thô hoặc ảnh hỏng của chương cũ.
*   **Path Parameters:**
| Tham số | Kiểu | Mô tả |
|---|---|---|
| `id` | String | ID chương cần sửa |

*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `images` | Array | Có | Mảng ảnh CDN dịch mới (Bắt buộc) |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "id": "65def001e4b0c9a987654321",
    "message": "Chương đã được cập nhật ảnh dịch thành công"
  }
}
```

---

### 4.6 PATCH `/api/v1/internal/stories/:id` - Cập nhật lastChapterUrl truyện
*   **Mô tả:** Cập nhật thông tin điểm tựa cào của bộ truyện sau Discovery.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `lastChapterUrl` | String | Có | URL đọc chương cuối mới nhất cào được |
| `status` | String | Không | Cập nhật trạng thái truyện (VD: `Ongoing`) |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "id": "64abc123e4b0c9a123456789",
    "lastChapterUrl": "https://nettruyennew.com/truyen-tranh/naruto/chap-701"
  }
}
```

---

### 4.7 PATCH `/api/v1/internal/stories/:id/hash` - Cập nhật Hash chương cuối
*   **Mô tả:** Lưu trữ mã Hash mới sau khi tải chương thành công để Smart Crawl so sánh.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `latestChapterHash`| String | Có | Mã MD5 hash của mảng ảnh gốc chương cuối |

*   **Phản hồi mẫu (200 OK):**
```json
{
  "data": {
    "id": "64abc123e4b0c9a123456789",
    "latestChapterHash": "9b1deb4d3b35c0cf56a2b8e398d28e75"
  }
}
```

---

### 4.8 POST `/api/v1/internal/logs` - Ghi log chạy cào
*   **Mô tả:** Lưu nhật ký cào để Admin Dashboard hiển thị.
*   **Request Body:**
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `storyId` | String | Không | ID bộ truyện cào (Có thể trống nếu Job lỗi Discovery đầu) |
| `botConfigId` | String | Có | ID cấu hình Bot thực hiện Job |
| `jobType` | String | Có | `FULL_CRAWL` hoặc `SMART_CRAWL` |
| `targetUrl` | String | Có | URL được cào trong Job |
| `status` | String | Có | `SUCCESS` hoặc `FAILED` |
| `errorMessage` | String | Không | Chi tiết lỗi nếu `status` là `FAILED` |
| `crawledItems` | Number | Không | Số chương/ảnh đã cào thành công |
| `executionTimeMs`| Number | Có | Thời gian chạy tác vụ |

*   **Phản hồi mẫu (201 Created):**
```json
{
  "data": {
    "id": "64abc111e4b0c9a999999999",
    "status": "SUCCESS"
  }
}
```
