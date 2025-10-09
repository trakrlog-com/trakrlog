import { BaseModel } from '../../core/baseModel';
import mongoose, { Schema } from 'mongoose';

export type ProjectModel = {
    userId: Schema.Types.ObjectId;
    logoBase64?: string;
} & BaseModel;


const ProjectSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    logoBase64: { type: String }
}, {
    timestamps: true
});

export const Project = mongoose.model('Project', ProjectSchema);
