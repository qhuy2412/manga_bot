import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: 'ADMIN' | 'USER';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' }
}, {
    timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
