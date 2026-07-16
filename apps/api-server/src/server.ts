import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/connect";
import bcrypt from "bcryptjs";
import { startCrawlScheduler } from "./shared/scheduler/crawl.scheduler";
import { config } from "./config/config";
import { User } from "./models";

// Hàm tự động tạo tài khoản admin mặc định khi chạy lần đầu
const seedAdmin = async (): Promise<void> => {
    try {
        const adminCount = await User.countDocuments({ role: "ADMIN" });
        if (adminCount === 0) {
            const defaultPassword = "admin123";
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            
            await User.create({
                username: "admin",
                passwordHash,
                role: "ADMIN"
            });
            console.log(`[Seed] Default Admin account created:`);
            console.log(`  - Username: admin`);
            console.log(`  - Password: ${defaultPassword}`);
        }
    } catch (error) {
        console.error(`[Seed] Error seeding admin account:`, error);
    }
};

// Khởi chạy server
connectDB(config.MONGODB_URI)
    .then(async () => {
        // Thực hiện seed dữ liệu admin
        await seedAdmin();

        // Khởi chạy scheduler cào tự động
        startCrawlScheduler();

        // Lắng nghe cổng kết nối
        app.listen(config.PORT, () => {
            console.log(`[Server] MangaBot API Server is running on port ${config.PORT}`);
        });
    })
    .catch((error) => {
        console.error("[Bootstrap] Server bootstrap failed:", error);
        process.exit(1);
    });
