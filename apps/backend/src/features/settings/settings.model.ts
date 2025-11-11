import mongoose, { Schema, Document } from 'mongoose';

export type SettingsModel = {
    _id?: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    theme: 'light' | 'dark' | 'system';
    timezone?: string;
    notifications: {
        email: boolean;
        push: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
    apiKey: string;
    apiKeyExpiresOn: Date;
};

export type SettingsDocument = SettingsModel & Document;

const SettingsSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    timezone: { type: String },
    notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
    },
    apiKey: { type: String, required: true },
    apiKeyExpiresOn: { type: Date, required: true }
}, {
    timestamps: true
});


export const Settings = mongoose.model<SettingsDocument>('Settings', SettingsSchema);
