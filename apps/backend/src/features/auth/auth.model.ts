import { BaseModel } from '../../core/baseModel';
import mongoose, { Schema } from 'mongoose';

export type UserModel = {
    email?: string;
    isBlocked: boolean;
    imageUrl: string | undefined;
    apiKey?: string;
    apiKeyExpiresOn?: Date;
} & BaseModel;


const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    isBlocked: { type: Boolean, default: false },
    imageUrl: { type: String },
    apiKey: { type: String, unique: true, sparse: true }, // For SDK authentication
    apiKeyExpiresOn: { type: Date } // Expiry date for the API key
}, {
    timestamps: true
});

export const User = mongoose.model('User', UserSchema);
