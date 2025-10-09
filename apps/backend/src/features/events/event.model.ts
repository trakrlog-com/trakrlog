import { Schema, model } from 'mongoose';

export type EventModel = {
    userId: Schema.Types.ObjectId;
    projectId: Schema.Types.ObjectId;
    channelId: Schema.Types.ObjectId;
    title: string;
    description?: string;
    tags?: Record<string, any>;
    icon?: string;
};

const eventSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
    tags: { type: Schema.Types.Mixed },
    icon: { type: String }
}, {
    timestamps: true
});

export const Event = model<EventModel>('Event', eventSchema);