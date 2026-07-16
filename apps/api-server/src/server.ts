import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/connect";
import bcrypt from "bcryptjs";
import { startCrawlScheduler } from "./shared/scheduler/crawl.scheduler";
import { config } from "./config/config";
import { User, Genre } from "./models";

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

// Hàm tự động tạo các thể loại mặc định khi chạy lần đầu
const seedGenres = async (): Promise<void> => {
    try {
        const genreCount = await Genre.countDocuments();
        if (genreCount === 0) {
            const defaultGenres = [
                { name: "Hành động", slug: "hanh-dong", description: "Thể loại hành động kịch tính, chiến đấu quyết liệt" },
                { name: "Phiêu lưu", slug: "phieu-luu", description: "Các chuyến thám hiểm, hành trình khám phá thế giới mới" },
                { name: "Hài hước", slug: "hai-huoc", description: "Những tình huống dở khóc dở cười, gây cười cho độc giả" },
                { name: "Kỳ ảo", slug: "ky-ao", description: "Thế giới phép thuật, sinh vật huyền bí và các yếu tố phi thực tế" },
                { name: "Huyền thoại", slug: "huyen-thoai", description: "Những câu chuyện dân gian hoặc sử thi hào hùng" },
                { name: "Đời thường", slug: "doi-thuong", description: "Những lát cắt cuộc sống bình dị hàng ngày" },
                { name: "Khoa học viễn tưởng", slug: "khoa-hoc-vien-tuong", description: "Thế giới công nghệ tương lai, du hành vũ trụ" },
                { name: "Siêu nhiên", slug: "sieu-nhien", description: "Các thế lực tâm linh, ma quỷ, năng lực ngoại cảm" },
                { name: "Drama", slug: "drama", description: "Những bi kịch, mâu thuẫn gia đình xã hội sâu sắc" },
                { name: "Lãng mạn", slug: "lang-man", description: "Câu chuyện tình cảm đôi lứa ngọt ngào" }
            ];
            await Genre.insertMany(defaultGenres);
            console.log(`[Seed] Default genres seeded successfully (${defaultGenres.length} genres created).`);
        }
    } catch (error) {
        console.error(`[Seed] Error seeding genres:`, error);
    }
};

// Khởi chạy server
connectDB(config.MONGODB_URI)

    .then(async () => {
        // Thực hiện seed dữ liệu admin và thể loại
        await seedAdmin();
        await seedGenres();

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
