import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as keys from '@trakrlog/common/keys';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(keys.MONGODB_URI);
    console.log('⚡️[server]: MongoDB connected successfully');
  } catch (error) {
    console.error('⚡️[server]: MongoDB connection error:', error);
    process.exit(1);
  }
}; 