import { BaseModel } from '../../core/baseModel';
import mongoose, { Schema } from 'mongoose';

export type ChannelModel = {
    userId: Schema.Types.ObjectId;
    projectId: Schema.Types.ObjectId;
    icon?: string;
    type?: string;
    enabled: boolean;
} & BaseModel;

const ChannelSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    icon: { type: String },
    type: { type: String },
    enabled: { type: Boolean, default: true },
}, {
    timestamps: true
});

export const Channel = mongoose.model('Channel', ChannelSchema);