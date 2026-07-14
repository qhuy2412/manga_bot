import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChapter extends Document {
  storyId: Types.ObjectId;
  chapterName: string;
  chapterIndex: number;
  language: string;
  images?: string[];
  content?: string;
  sourceUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IChapter>({
  storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
  chapterName: { type: String, required: true },
  chapterIndex: { type: Number, required: true },
  language: { type: String, default: 'vi' },
  images: { type: [String], default: [] },
  content: { type: String },
  sourceUrl: { type: String, required: true }
}, {
  timestamps: true
});

ChapterSchema.index({ storyId: 1, chapterIndex: 1 }, { unique: true });
ChapterSchema.index({ storyId: 1, chapterIndex: -1 });

export default mongoose.model<IChapter>('Chapter', ChapterSchema);
