import { ChapterRepository } from "./chapter.repository";
import { StoryRepository } from "../story/story.repository";
import { CreateChapterDTO } from "./chapter.dto";
import { NotFoundError } from "../../shared/errors/AppError";
import crypto from "crypto";

export class ChapterService {
    constructor(
        private chapterRepo: ChapterRepository,
        private storyRepo: StoryRepository
    ) {}

    async getChapter(storyId: string, chapterIndex: number) {
        const chapter = await this.chapterRepo.findByIndex(storyId, chapterIndex);
        if (!chapter) {
            throw new NotFoundError("Chapter not found!");
        }
        return chapter;
    }

    async getChaptersByStoryId(storyId: string) {
        return await this.chapterRepo.findAllByStoryId(storyId);
    }

    // Nghiệp vụ lưu chapter cào từ Worker và cập nhật thông tin truyện
    async upsertChapter(data: CreateChapterDTO) {
        // 1. Kiểm tra xem truyện có tồn tại hay không
        const story = await this.storyRepo.findById(data.storyId);
        if (!story) {
            throw new NotFoundError("Associated Story not found!");
        }

        // 2. Tiến hành upsert chapter vào database
        const chapter = await this.chapterRepo.upsert(data.storyId, data.chapterIndex, data);

        // 3. Tính toán hash md5 của nội dung ảnh để cập nhật cho Story (chống cập nhật thầm lặng)
        const imagesString = data.images.join(",");
        const hash = crypto.createHash("md5").update(imagesString).digest("hex");

        // 4. Cập nhật thông tin chương mới nhất vào Story model
        await this.storyRepo.update(data.storyId, {
            lastChapterUrl: data.sourceUrl,
            latestChapterHash: hash
        });

        return chapter;
    }

    async deleteChapter(id: string) {
        const chapter = await this.chapterRepo.findById(id);
        if (!chapter) {
            throw new NotFoundError("Chapter not found!");
        }
        await this.chapterRepo.delete(id);
        return { message: "Chapter deleted successfully!" };
    }
}
