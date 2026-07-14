import mongoose from "mongoose";
import { Schema, Document } from 'mongoose';

interface ICrawlSource extends Document {
    name: string,
    domain: string,
    isActive: boolean
}
const crawlSource = new Schema<ICrawlSource>({
    name: { type: String, required: true },
    domain: { type: String, required: true },
    isActive: { type: Boolean, default: true }
})

export default mongoose.model<ICrawlSource>('CrawlSource', crawlSource);
