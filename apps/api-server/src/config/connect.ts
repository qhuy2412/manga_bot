import mongoose from 'mongoose';

/**
 * Hàm khởi tạo kết nối đến MongoDB
 * @param uri Chuỗi kết nối MongoDB (VD: mongodb://localhost:27017/mangabot)
 */
export const connectDB = async (uri: string): Promise<void> => {
    try {
        // Ngăn Mongoose cảnh báo strictQuery
        mongoose.set('strictQuery', false);

        // Thực hiện kết nối
        await mongoose.connect(uri);

        console.log(`[Database] MongoDB Connected Successfully!`);
    } catch (error) {
        console.error(`[Database] MongoDB Connection Failed:`, error);
        // Thoát process nếu không thể kết nối DB (quan trọng với Worker/API)
        process.exit(1);
    }
};

// Lắng nghe các sự kiện mất kết nối
mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB Disconnected! Mongoose is trying to reconnect...');
});
