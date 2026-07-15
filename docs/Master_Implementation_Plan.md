# Master Implementation Plan (Kế hoạch Lập trình Chi tiết)

Tài liệu này là cẩm nang từng bước (step-by-step) với **các lệnh Terminal và cấu hình cụ thể** để bạn có thể copy-paste và làm theo. Nếu có bất kỳ dòng lệnh hay file nào không hiểu, bạn cứ dừng lại và hỏi tôi nhé.

---

## Giai đoạn 1: Khởi tạo Dự án & Môi trường (Project Init)

### Bước 1: Khởi tạo Cấu trúc thư mục độc lập (giống xhr_demo)
Dự án được tổ chức dưới dạng các thư mục con độc lập hoàn toàn (không dùng NPM Workspaces). Cấu trúc như sau:
```text
d:\MangaBot\
├── apps/
│   ├── api-server/         # API Server chính (chứa cả Database layer)
│   └── crawler-worker/     # Worker cào dữ liệu ngầm
├── docs/                   # Tài liệu hướng dẫn
└── tsconfig.base.json      # Cấu hình TS chung ở root
```
Mở Terminal tại thư mục gốc `d:\MangaBot` để tạo các thư mục kiến trúc lõi:
```bash
mkdir apps
mkdir apps\api-server
mkdir apps\crawler-worker
```

### Bước 2: Cấu hình TypeScript chuẩn ở root
Tạo file `tsconfig.base.json` ở thư mục gốc (`d:\MangaBot\tsconfig.base.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  }
}
```

### Bước 3: Cấu hình Git & Biến môi trường
Tạo file `.gitignore` ở thư mục gốc:
```text
node_modules
dist
.env
```
Tạo file `.env.example` ở thư mục gốc (để làm mẫu cho team):
```env
# Database
MONGO_URI=mongodb://localhost:27017/mangabot
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_super_secret_jwt_key
INTERNAL_TOKEN=your_super_secret_internal_worker_key

# Crawl Source Config
CRAWL_SOURCE_NAME=DiLib
CRAWL_SOURCE_DOMAIN=dilib.vn

# External API
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

---

## Giai đoạn 2: Xây dựng Data Layer (Nằm trong `apps/api-server/src/database`)
*Mục tiêu: Xây dựng các Mongoose Schemas & Models trực tiếp bên trong API Server để quản lý kết nối MongoDB và thao tác dữ liệu.*

### Bước 1: Cấu trúc thư mục Database
Tạo thư mục `src/database` và `src/database/models` bên trong `apps/api-server`.

### Bước 2: Viết code Kết nối và Schemas
1. **File `src/database/connect.ts`:** Viết hàm `connectDB(uri)` sử dụng `mongoose.connect()`.
2. **File `src/database/models/Story.ts`:** Cấu hình chuẩn V4.8 (Có `selectorOverrides`, `cronSchedule`, `nextCrawlTime`).
   * *Đánh Index:* `schema.index({ isAutoUpdate: 1, nextCrawlTime: 1 })`
3. **File `src/database/models/Chapter.ts`:**
   * *Đánh Unique Index:* `schema.index({ storyId: 1, chapterIndex: 1 }, { unique: true })` (Phục vụ Upsert).
4. **Viết tiếp các model còn lại:** `BotConfig.ts`, `CrawlLog.ts`, `User.ts`.
5. **File `src/database/index.ts`:**
   ```typescript
   export * from './connect';
   export * from './models/Story';
   export * from './models/Chapter';
   export * from './models/BotConfig';
   export * from './models/CrawlLog';
   ```

---

## Giai đoạn 3: Xây dựng Main API Server (`apps/api-server`)

### Bước 1: Khởi tạo App API
Vào thư mục `apps\api-server` và khởi tạo:
```bash
cd apps/api-server
npm init -y
npm install express cors helmet dotenv jsonwebtoken cron-parser bullmq zod morgan mongoose
npm install -D typescript @types/express @types/cors @types/jsonwebtoken @types/morgan @types/node tsx
```
Mở file `apps\api-server\package.json`, cấu hình các scripts và dependencies như sau:
```json
{
  "name": "@mangabot/api-server",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "bullmq": "^5.80.2",
    "cors": "^2.8.6",
    "cron-parser": "^5.6.2",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.3",
    "morgan": "^1.11.0",
    "mongoose": "^8.0.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/morgan": "^1.9.10",
    "@types/node": "^26.1.1",
    "tsx": "^4.19.0",
    "typescript": "^7.0.2"
  },
  "scripts": {
    "start": "tsx src/server.ts",
    "dev": "tsx watch src/server.ts"
  }
}
```

Tạo file `apps/api-server/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

### Bước 2: Cấu hình Khởi tạo, Config & Logging
1. **Tạo `src/config.ts`**: Validate các biến môi trường bằng Zod:
   ```typescript
   import { z } from "zod";
   const ConfigSchema = z.object({
     PORT: z.coerce.number().default(3000),
     MONGO_URI: z.string().url(),
     REDIS_URL: z.string().url(),
     JWT_SECRET: z.string().min(8),
     INTERNAL_TOKEN: z.string().min(8),
     CRAWL_SOURCE_NAME: z.string().default("DiLib"),
     CRAWL_SOURCE_DOMAIN: z.string().default("dilib.vn"),
   });
   export const config = ConfigSchema.parse(process.env);
   ```
2. **Tạo `src/utils/logger.ts`**: Helper ghi log có cấu trúc:
   ```typescript
   const fmt = (level: string, tag: string, msg: string) => 
     `[${new Date().toISOString()}] [${level.toUpperCase()}] [${tag}] ${msg}`;
   export const logger = {
     info: (tag: string, msg: string) => console.log(fmt("info", tag, msg)),
     error: (tag: string, msg: string, err?: any) => {
       console.error(fmt("error", tag, msg));
       if (err?.stack) console.error(err.stack);
     }
   };
   ```
3. **Tạo `src/server.ts`**: Khởi chạy Express và gọi `connectDB(config.MONGO_URI)`. Dùng `logger` để thông báo trạng thái. Import connectDB theo đường dẫn tương đối:
   ```typescript
   import { connectDB } from "./database";
   ```
4. **Tạo `src/middlewares/auth.middleware.ts`**: Verify JWT cho Admin.
5. **Tạo `src/middlewares/internal.middleware.ts`**: Verify `req.headers['x-internal-token'] === config.INTERNAL_TOKEN`.

### Bước 3: Code các API cốt lõi
1. **Admin API:** Code các route CRUD trong `src/routes/admin.route.ts` cho Truyện và Bot.
2. **Cronjob Logic:** Mỗi khi tạo Truyện có `cronSchedule`, dùng thư viện `cron-parser` tính ra mốc Date lưu vào `nextCrawlTime`.
3. **System Scheduler:** Tạo `src/scheduler/index.ts` chứa vòng lặp `setInterval` (mỗi 1 phút):
   * Query DB: `Story.find({ isAutoUpdate: true, nextCrawlTime: { $lte: new Date() } })`.
   * Thêm Job vào Queue bằng `bullmq`.
   * Cập nhật ngay lập tức `nextCrawlTime` mới cho các truyện đó.

---

## Giai đoạn 4: Xây dựng Crawl Worker (`apps/crawler-worker`)

### Bước 1: Khởi tạo Worker App
Vào thư mục `apps\crawler-worker`:
```bash
cd apps/crawler-worker
npm init -y
npm install bullmq ioredis cheerio sharp cloudinary axios sanitize-html dotenv zod
npm install -D typescript @types/node tsx
```
Mở file `apps/crawler-worker/package.json` và cấu hình scripts và devDependencies sử dụng `tsx`:
```json
{
  "name": "@mangabot/crawler-worker",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "axios": "^1.6.0",
    "bullmq": "^5.8.0",
    "cheerio": "^1.0.0-rc.12",
    "cloudinary": "^2.0.0",
    "dotenv": "^16.4.5",
    "ioredis": "^5.3.2",
    "sanitize-html": "^2.11.0",
    "sharp": "^0.32.6",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^26.1.1",
    "@types/sanitize-html": "^2.9.0",
    "tsx": "^4.19.0",
    "typescript": "^7.0.2"
  },
  "scripts": {
    "start": "tsx src/worker.ts",
    "dev": "tsx watch src/worker.ts"
  }
}
```

Tạo file `apps/crawler-worker/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```
*Lưu ý:* Crawler Worker **không kết nối trực tiếp đến Database và không dùng chung package với API Server**. Mọi giao tiếp ghi dữ liệu và truy vấn trạng thái/hash đều thông qua API Server bằng các Internal Endpoints bảo mật bằng `INTERNAL_TOKEN` (tương tự như cách `xhr_demo` liên kết Bot và CMS).

Tạo `src/config.ts` để validate biến môi trường của Worker tương tự API Server.

### Bước 2: Code Luồng xử lý Job
1. Tạo `src/worker.ts`: Khởi tạo `new Worker('crawl-queue', async (job) => {...})` của BullMQ.
2. Code luồng **Smart Crawl (Tự chữa lành & Khám phá)**:
   * Dùng Axios gọi URL, dùng Cheerio bóc tách HTML.
   * Tính mã Hash (MD5) của mảng ảnh. So sánh với `latestChapterHash` trong DB.
   * Quyết định: Skip hoặc Push job tải ảnh.
3. Code luồng **Tải & Nén ảnh**:
   * Dùng Axios (gắn referer) lấy mảng byte ảnh (Buffer).
   * Đẩy qua `sharp(buffer).webp({ quality: 75 }).toBuffer()`.
   * Dùng API Cloudinary upload mảng byte.
4. Cuối cùng, dùng Axios nội bộ (đính kèm `X-Internal-Token`) gọi về `POST http://localhost:<port>/api/v1/internal/chapters` để API Server lo việc Upsert vào Database.

---

*(Khi hoàn thành tới Giai đoạn 4, hệ thống Backend & Crawler coi như đã vận hành trơn tru. Ta sẽ lên plan riêng cho Giai đoạn Frontend).*
