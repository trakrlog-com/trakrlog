import { BaseModel } from '../../core/baseModel';
import mongoose, { Schema } from 'mongoose';

export type UserModel = {
    email?: string;
    isBlocked: boolean;
    imageUrl: string | undefined;
} & BaseModel;


const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    isBlocked: { type: Boolean, default: false },
    imageUrl: { type: String },
}, {
    timestamps: true
});

export const User = mongoose.model('User', UserSchema);
