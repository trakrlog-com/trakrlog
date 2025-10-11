import mongoose, { Schema, Document } from 'mongoose';

export interface WaitlistModel extends Document {
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const WaitlistSchema: Schema = new Schema({
    email: { 
        type: String, 
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(email: string) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Please enter a valid email address'
        }
    }
}, {
    timestamps: true
});

export const Waitlist = mongoose.model<WaitlistModel>('Waitlist', WaitlistSchema);