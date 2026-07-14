import mongoose from "mongoose";
import { Document, ObjectId, Schema } from 'mongoose';

interface ICrawlLog extends Document {
    storyId: ObjectId,
    botConfigId: ObjectId,
    jobType: string,
    targetUrl: string,
    status: string,
    errorMessage: string,
    crawledItems: number,
    executionTimeMs: number,
    createdAt: Date
}

const crawlLogSchema = new Schema<ICrawlLog>({
    storyId: { type: String, required: true, ref: "Story" },
    botConfigId: { type: String, required: true, ref: "BotConfig" },
    jobType: { type: String, required: true, enum: ["FULL_CRAWL", "CRON_CRAWL"] },
    targetUrl: { type: String, required: true },
    status: { type: String, required: true, enum: ["SUCCESS", "FAILED"] },
    errorMessage: { type: String },
    crawledItems: { type: Number, required: true },
    executionTimeMs: { type: Number, required: true },
    createdAt: { type: Date, required: true }
});

export default mongoose.model<ICrawlLog>("CrawlLog", crawlLogSchema);
