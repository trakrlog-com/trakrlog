import dotenv from "dotenv";

dotenv.config();

export const CLIENT_HOME_PAGE_URL = "http://localhost:3000";
export const API_URL = "http://localhost:4000";

export const AUTH_PROVIDER = process.env.VITE_AuthProvider as string;
export const GOOGLE_CLIENT_ID = process.env.VITE_GoogleClientId as string;
export const GOOGLE_CLIENT_SECRET = process.env.VITE_GoogleClientSecret as string;

export const SESSION_SECRET = process.env.SessionSecret as string;

export const WAITLIST_ENABLED = process.env.VITE_WaitlistEnabled === 'true' || false;

export const MONGODB_URI = process.env.DbUri as string;

